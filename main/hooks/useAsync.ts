import { useEffect } from "react";

// useEffect(() => {
//     let isMounted = true;               // note mutable flag
//     someAsyncOperation().then(data => {
//       if (isMounted) setState(data);    // add conditional check
//     })
//     return () => { isMounted = false }; // cleanup toggles value, if unmounted
//   }, []);                               // adjust dependencies to your needs

export function useAsync(
  asyncFn: () => Promise<void>,
  onSuccess: (x: any) => Promise<void>
) {
  useEffect(() => {
    let isActive = true;
    asyncFn().then((data) => {
      if (isActive) onSuccess(data);
    });
    return () => {
      isActive = false;
    };
  }, [asyncFn, onSuccess]);
}
