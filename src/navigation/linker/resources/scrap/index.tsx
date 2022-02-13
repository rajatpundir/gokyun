import * as React from "react";

import { NavigatorProps as ParentNavigatorProps } from "..";

export default function Component(props: ParentNavigatorProps<"Scrap">) {
  return <></>;
}

// export function Loader(props: RootNavigatorProps<"Search">): JSX.Element {
//   const api = create({
//     baseURL: `https://pixabay.com/`,
//   });
//   useEffect(() => {
//     const x = async () => {
//       console.log("##############################");
//       const response = await api.get("/");
//       //   console.log("===============", response.data);
//       const root = cheerio.load(response.data as string);
//       root("img").each((index, element) => {
//         console.log("------------------------");
//         const x = root(element).attr();
//         console.log(x["alt"]);
//         console.log(x["src"]);
//         console.log("------------------------");
//       });
//       console.log("##############################");
//     };
//     x();
//   }, []);
//   return (
//     <>
//       <ModalHeader title={"Linker"} />
//     </>
//   );
// }
