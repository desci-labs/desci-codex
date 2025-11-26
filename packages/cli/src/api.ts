import axios, { type AxiosInstance } from "axios";
import FormData from "form-data";
import { createReadStream, statSync } from "fs";
import { basename, relative } from "path";
import { glob } from "glob";
import { getApiKey, getEnvConfig } from "./config.js";

export interface NodeInfo {
  uuid: string;
  id: string;
  title: string;
  cid: string;
  isPublished: boolean;
  manifestUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface DriveItem {
  name: string;
  path: string;
  cid: string;
  type: "file" | "dir";
  size?: number;
  contains?: DriveItem[];
}

export interface Manifest {
  version: string;
  title: string;
  description?: string;
  defaultLicense?: string;
  components: Array<{
    id: string;
    name: string;
    type: string;
    payload: {
      cid?: string;
      path?: string;
    };
  }>;
}

function createClient(): AxiosInstance {
  const { apiUrl } = getEnvConfig();
  const apiKey = getApiKey();

  const client = axios.create({
    baseURL: apiUrl,
    timeout: 300000, // 5 min timeout for large uploads
    headers: {
      ...(apiKey ? { "api-key": apiKey } : {}),
    },
  });

  return client;
}

export async function listNodes(): Promise<NodeInfo[]> {
  const client = createClient();
  const response = await client.get("/v1/nodes/");
  return response.data.nodes || [];
}

export async function getNode(uuid: string): Promise<NodeInfo> {
  const client = createClient();
  const response = await client.get(`/v1/nodes/objects/${uuid}`);
  return response.data;
}

export async function createNode(
  title: string,
): Promise<{ uuid: string; node: NodeInfo }> {
  const client = createClient();
  const response = await client.post("/v1/nodes/createDraft", {
    title,
    defaultLicense: "CC BY 4.0",
    researchFields: [],
    links: { pdf: [], metadata: [] },
  });
  return { uuid: response.data.node.uuid, node: response.data.node };
}

export async function getDriveTree(uuid: string): Promise<DriveItem[]> {
  const client = createClient();
  const response = await client.get(`/v1/data/retrieveTree/${uuid}/tree`);
  return response.data.tree || [];
}

export async function getPublishedTree(
  manifestCid: string,
  rootCid: string,
  uuid: string,
): Promise<DriveItem[]> {
  const client = createClient();
  const response = await client.get(
    `/v1/data/retrieveTree/published/${manifestCid}/${rootCid}/${uuid}`,
  );
  return response.data.tree || [];
}

export interface UploadResult {
  manifest: Manifest;
  manifestCid: string;
  tree: DriveItem[];
}

export async function uploadFiles(
  uuid: string,
  files: string[],
  targetPath = "root",
  onProgress?: (uploaded: number, total: number) => void,
): Promise<UploadResult> {
  const client = createClient();
  const form = new FormData();

  form.append("uuid", uuid);
  form.append(
    "contextPath",
    targetPath.startsWith("/") ? targetPath : `/${targetPath}`,
  );

  let totalSize = 0;
  files.forEach((filePath) => {
    const stats = statSync(filePath);
    totalSize += stats.size;
    const stream = createReadStream(filePath);
    form.append("files", stream, { filename: basename(filePath) });
  });

  const response = await client.post("/v1/data/update", form, {
    headers: {
      ...form.getHeaders(),
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.loaded) {
        onProgress(progressEvent.loaded, totalSize);
      }
    },
  });

  return response.data;
}

export async function uploadFolder(
  uuid: string,
  folderPath: string,
  targetPath = "root",
  onProgress?: (current: number, total: number, fileName: string) => void,
): Promise<UploadResult> {
  // Find all files in the folder
  const files = await glob("**/*", {
    cwd: folderPath,
    nodir: true,
    absolute: true,
    ignore: ["**/node_modules/**", "**/.git/**", "**/.DS_Store"],
  });

  if (files.length === 0) {
    throw new Error(`No files found in folder: ${folderPath}`);
  }

  // Group files by their relative directory
  const filesByDir: Record<string, string[]> = {};

  for (const file of files) {
    const relPath = relative(folderPath, file);
    const dir = relPath.includes("/")
      ? relPath.substring(0, relPath.lastIndexOf("/"))
      : "";
    const key = dir || ".";
    if (!filesByDir[key]) filesByDir[key] = [];
    filesByDir[key].push(file);
  }

  // Create folders first, then upload files
  const client = createClient();
  const dirs = Object.keys(filesByDir).sort();
  let result: UploadResult | undefined;
  let uploadedCount = 0;

  // Create necessary folders
  for (const dir of dirs) {
    if (dir !== ".") {
      const parts = dir.split("/");
      let currentPath = targetPath;
      for (const part of parts) {
        try {
          const form = new FormData();
          form.append("uuid", uuid);
          form.append(
            "contextPath",
            currentPath.startsWith("/") ? currentPath : `/${currentPath}`,
          );
          form.append("newFolderName", part);
          await client.post("/v1/data/update", form, {
            headers: form.getHeaders(),
          });
        } catch {
          // Folder might already exist, continue
        }
        currentPath = `${currentPath}/${part}`;
      }
    }
  }

  // Upload files one at a time for better error handling
  let successCount = 0;
  let overwriteCount = 0;
  const errors: string[] = [];

  for (const dir of dirs) {
    const dirFiles = filesByDir[dir];
    const uploadPath = dir === "." ? targetPath : `${targetPath}/${dir}`;

    for (const file of dirFiles) {
      const fileName = relative(folderPath, file);

      if (onProgress) {
        onProgress(uploadedCount + 1, files.length, fileName);
      }

      try {
        result = await uploadFiles(uuid, [file], uploadPath);
        successCount++;
      } catch (err: unknown) {
        const axiosErr = err as {
          response?: { status?: number; data?: unknown };
        };

        // 409 Conflict - file already exists, delete and retry to overwrite
        if (axiosErr.response?.status === 409) {
          try {
            // Delete the existing file
            const filePath = `${uploadPath}/${basename(file)}`;
            await deleteData(uuid, filePath);

            // Retry upload
            result = await uploadFiles(uuid, [file], uploadPath);
            overwriteCount++;
            successCount++;
          } catch (retryErr: unknown) {
            // If retry also fails, log the error
            const retryAxiosErr = retryErr as {
              response?: { status?: number; data?: unknown };
            };
            const errorData = retryAxiosErr.response?.data;
            const errorMsg =
              typeof errorData === "object" && errorData !== null
                ? JSON.stringify(errorData)
                : String(errorData || (retryErr as Error).message);
            errors.push(`${fileName}: ${errorMsg}`);
          }
        } else {
          // Log error but continue with other files
          const errorData = axiosErr.response?.data;
          const errorMsg =
            typeof errorData === "object" && errorData !== null
              ? JSON.stringify(errorData)
              : String(errorData || (err as Error).message);
          errors.push(`${fileName}: ${errorMsg}`);
        }
      }

      uploadedCount++;
    }
  }

  // If we had some successes, consider it ok
  if (successCount === 0) {
    if (errors.length > 0) {
      throw new Error(
        `All uploads failed:\n  ${errors.slice(0, 5).join("\n  ")}`,
      );
    }
    throw new Error("Upload failed - no files were processed");
  }

  if (overwriteCount > 0) {
    console.log(`Overwrote ${overwriteCount} existing file(s)`);
  }

  // If we had errors but also successes, warn but don't fail
  if (errors.length > 0) {
    console.warn(`Warning: ${errors.length} file(s) failed to upload`);
  }

  // Get latest tree state if we don't have a result
  if (!result) {
    // Fetch current state
    const client = createClient();
    const response = await client.get(`/v1/data/retrieveTree/${uuid}/tree`);
    result = {
      manifest: {} as Manifest,
      manifestCid: "unknown",
      tree: response.data.tree || [],
    };
  }

  return result;
}

export async function createFolder(
  uuid: string,
  folderName: string,
  contextPath = "root",
): Promise<UploadResult> {
  const client = createClient();
  const form = new FormData();
  form.append("uuid", uuid);
  form.append(
    "contextPath",
    contextPath.startsWith("/") ? contextPath : `/${contextPath}`,
  );
  form.append("newFolderName", folderName);

  const response = await client.post("/v1/data/update", form, {
    headers: form.getHeaders(),
  });

  return response.data;
}

export async function deleteData(uuid: string, path: string): Promise<void> {
  const client = createClient();
  await client.post("/v1/data/delete", {
    uuid,
    path: path.startsWith("/") ? path : `/${path}`,
  });
}

export async function downloadFile(cid: string): Promise<Buffer> {
  const { ipfsGateway } = getEnvConfig();
  const response = await axios.get(`${ipfsGateway}/${cid}`, {
    responseType: "arraybuffer",
    timeout: 120000,
  });
  return Buffer.from(response.data);
}

export async function getManifest(manifestCid: string): Promise<Manifest> {
  const { ipfsGateway } = getEnvConfig();
  const response = await axios.get(`${ipfsGateway}/${manifestCid}`);
  return response.data;
}

export async function prepublish(uuid: string): Promise<{
  updatedManifestCid: string;
  updatedManifest: Manifest;
}> {
  const client = createClient();
  const response = await client.post("/v1/nodes/prepublish", { uuid });
  return response.data;
}
