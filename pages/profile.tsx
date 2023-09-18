import type { NextPage } from "next";
import Head from "next/head";
import { UserForm } from "@/components/UserForm";

const ProfilePage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Profile</title>
      </Head>
      <div className="content">
        <div>
          <UserForm />
        </div>
      </div>
    </>
  );
};

export default ProfilePage;
