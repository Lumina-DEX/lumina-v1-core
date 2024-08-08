import React, { useEffect, useState } from "react";
import useLoad from "@/states/useLoad";
const LoadingState = () => {
  const [visible, setVisible] = useState(true);

  const { loadMsg, loadState, process } = useLoad((state) => ({
    loadMsg: state.msg,
    loadState: state.state,
    process: state.process,
  }));

  useEffect(() => {
    if (loadState) {
      setTimeout(() => {
        setVisible(false);
      }, 3000);
    }
  }, [loadState, process]);

  return visible ? (
    <div className="fixed top-[80px] w-full flex justify-center z-[1] font-metrophobic">
      <div className="w-[300px] text-xl">
        <div className="relative w-full bg-white rounded-xl overflow-hidden">
          <div
            className="absolute top-0 h-4 rounded-xl shim-primary bg-primary"
            style={{ width: `${300 * process}px` }}
          />
        </div>
        <div className="w-full flex justify-center">
          {loadState ? (
            <p> Success </p>
          ) : (
            <div dangerouslySetInnerHTML={{ __html: loadMsg }} />
          )}
        </div>
      </div>
    </div>
  ) : (
    <></>
  );
};

export default LoadingState;
