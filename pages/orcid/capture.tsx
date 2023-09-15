import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function OrcidCodeProcess() {
  const query = useSearchParams();
  const code = query.get("code") as string;

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
        }
        if (window.location.search.indexOf("code=") > -1) {
          window.location.href = "/";
        }
      } catch (err) {
        alert("error capturing id_token ");
      }
    })();
  }, [code]);
  return <div className="text-white">loading orcid profile</div>;
}
