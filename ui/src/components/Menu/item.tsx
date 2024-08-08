import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import clsx from "classnames";

const Item = (props: any) => {
  const router = useRouter();
  const [flag, setFlag] = useState(0);
  useEffect(() => {
    const curPath = router.asPath;
    setFlag(0);
    if (curPath.search(props.link) >= 0) {
      setFlag(1);
    }
  }, [props.link, router.asPath]);

  return (
    <Link
      key={props.index}
      href={props.link}
      target={props.target ? "_blank" : ""}
      className={clsx("font-primary text-xl", {
        "font-bold": flag === 1,
      })}
    >
      {props.name}
    </Link>
  );
};

export default Item;
