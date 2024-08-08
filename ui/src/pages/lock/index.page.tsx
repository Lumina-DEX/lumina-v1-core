import React, { useState } from "react";
import { Form, Input } from "react-daisyui";
import { useCookies } from "react-cookie";
import { useRouter } from "next/router";

const LOCK_PASSWORD = process.env.NEXT_PUBLIC_PASSWORD;

function LockPage() {
  const router = useRouter();
  const [cookies, setCookie] = useCookies(["expired_at"]);
  const [password, setPassword] = useState("");

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!!LOCK_PASSWORD && LOCK_PASSWORD === password) {
      const expired_at = new Date().getTime() + 1000 * 60 * 60 * 2; // 2 hours
      setCookie("expired_at", expired_at.toString());
      router.push("/");
    }
  };

  return (
    <Form
      className="flex flex-col items-center justify-center gap-10 bg-white w-screen h-screen fixed"
      onSubmit={onSubmit}
    >
      <Input
        type="password"
        size="lg"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
    </Form>
  );
}

export default LockPage;
