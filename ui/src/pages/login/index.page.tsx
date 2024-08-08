import { createClient } from "@supabase/supabase-js";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { useSession, useSupabaseClient } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";

const Login = ({
  redirect_url,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const session = useSession();
  const supabase = useSupabaseClient();
  const router = useRouter();

  if (session) {
    router.push(redirect_url);
  }
  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center">
      <div className="max-w-lg w-full">
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={[]}
        />
      </div>
    </div>
  );
};

export default Login;

export const getServerSideProps: GetServerSideProps<{
  redirect_url: string;
}> = async (context) => {
  const redirect_url =
    (context.query.redirect as string | undefined) ?? "/dash";

  return {
    props: {
      redirect_url,
    },
  };
};
