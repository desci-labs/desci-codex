import { useSearchParams } from "next/navigation";
import { useRouter } from "next/router";
import { useEffect } from "react";

export default function OrcidCodeProcess() {
  const query = useSearchParams();
  const code = query.get("code") as string;
  const router = useRouter();
  useEffect(() => {
    if (!code) {
      return;
    }
    (async () => {
      try {
        const resp = await fetch(
          `/api/orcid`,

          {
            headers: {
              "content-type": "application/json",
            },
            method: "post",
            body: JSON.stringify({ code }),
            redirect: "follow",
          }
        );

        const {
          access_token,
          refresh_token,
          expires_in,
          scope,
          name,
          orcid,
          id_token,
        } = await resp.json();

        if (id_token) {
          window.localStorage.setItem("orcid:idToken", id_token);
          window.localStorage.setItem("orcid:refresh_token", refresh_token);
          window.localStorage.setItem("orcid:access_token", access_token);

          window.postMessage("orcid:login");
        }
        if (window.location.search.indexOf("code=") > -1) {
          router.push("/");
        }
      } catch (err) {
        alert("error capturing id_token ");
      }
    })();
  }, [code, router]);
  return <div className="text-white">loading orcid profile</div>;
}
