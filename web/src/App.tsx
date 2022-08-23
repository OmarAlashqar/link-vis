import {
  Alert,
  AlertIcon,
  AlertTitle,
  Button,
  Flex,
  FormLabel,
  Switch,
} from "@chakra-ui/core";
import { Form, Formik } from "formik";
import React, { useState } from "react";
import { ForceGraph2D, ForceGraph3D } from "react-force-graph";
import { Footer, footerHeight } from "./components/Footer";
import { InputField } from "./components/InputField";
import { LinkData } from "./types";
import { FieldError, toErrorMap } from "./utils/toErrorMap";
import { useWindowSize } from "./utils/useWindowSize";

type AlertStatus = "info" | "error" | "success" | "warning" | undefined;
type AlertMode = "hint" | "error" | "long-1" | "long-2" | "partial" | "hidden";

const App = () => {
  const [alertMode, setAlertMode] = useState<AlertMode>("hint");
  const { width, height } = useWindowSize();
  const [is3D, setIs3D] = useState(true);

  let [{ nodes, edges }, setData] = useState<LinkData>({
    nodes: [],
    edges: [],
  });

  let alertStatus: AlertStatus = "info";
  let alertText = "";

  if (alertMode === "hint") {
    alertText = "Type in a website URL to visualize all the links it leads to!";
  } else if (alertMode === "error") {
    alertStatus = "error";
    alertText = "Something went wrong";
  } else if (alertMode === "long-1") {
    alertText = "This may take a while, hold tight!";
  } else if (alertMode === "long-2") {
    alertText =
      "Crawling is taking longer than usual. There are so many links!";
  } else if (alertMode === "partial") {
    alertText = " Crawling was cut short, this is partial data";
  }

  const ForceGraph = is3D ? ForceGraph3D : ForceGraph2D;

  return (
    <>
      <Flex flexDir="column">
        <Flex flex={1}>
          <ForceGraph
            width={width}
            height={height ? height - footerHeight : undefined}
            nodeLabel="url"
            nodeId="id"
            linkSource="fromId"
            linkTarget="toId"
            linkDirectionalArrowLength={3.5}
            linkDirectionalArrowRelPos={1}
            graphData={{ nodes, links: edges }}
            warmupTicks={100}
            cooldownTicks={0}
          />
        </Flex>
        <Footer />
      </Flex>

      <Flex pos="absolute" top={0} mt={8} ml={8}>
        <Formik
          initialValues={{ url: "" }}
          onSubmit={async ({ url }, { setErrors }) => {
            if (!url) return;

            setAlertMode("hidden");

            let errors: FieldError[] | undefined;
            let data: LinkData | undefined;
            let partial: boolean = false;

            try {
              const timer1 = setTimeout(() => {
                setAlertMode("long-1");
              }, 5 * 1000);

              const timer2 = setTimeout(() => {
                setAlertMode("long-2");
              }, 20 * 1000);

              const response = await fetch(
                `${process.env.REACT_APP_API_URL}/crawl?seed=${encodeURI(url)}`
              );

              clearTimeout(timer1);
              clearTimeout(timer2);

              ({ errors, data, partial } = await response.json());
            } catch (err) {
              setAlertMode("error");
              return;
            }

            if (errors) setErrors(toErrorMap(errors));
            if (data) setData(data);

            if (partial) setAlertMode("partial");
            else setAlertMode("hidden");
          }}
        >
          {({ isSubmitting, values: { url } }) => (
            <Form>
              <Flex flexDir="column" align="flex-start" maxW="90%">
                {/* Main inputs */}
                <Flex flexDir="row">
                  <InputField name="url" placeholder="url" />
                  <Button
                    type="submit"
                    isLoading={isSubmitting}
                    isDisabled={!url}
                    variantColor="teal"
                    ml={4}
                  >
                    Crawl
                  </Button>
                </Flex>

                {/* 2D/3D selector */}
                <Flex justify="center" align="center" mt={4}>
                  <FormLabel htmlFor="dims" color="ui">
                    2D
                  </FormLabel>
                  <Switch
                    id="dims"
                    isChecked={is3D}
                    onChange={(e) => setIs3D(e.currentTarget.checked)}
                    color="teal"
                    mr={2}
                  />
                  <FormLabel htmlFor="dims" color="ui">
                    3D
                  </FormLabel>
                </Flex>

                {!alertText ? null : (
                  <Alert status={alertStatus} mt={4}>
                    <AlertIcon />
                    <AlertTitle mr={2}>{alertText}</AlertTitle>
                  </Alert>
                )}
              </Flex>
            </Form>
          )}
        </Formik>
      </Flex>
    </>
  );
};

export default App;
