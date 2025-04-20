import { useEffect, useState } from "react";
import { useRouter } from "expo-router";

export default function Index() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) {
      router.replace("/welcome");
    }
  }, [ready]);

  return null;
}