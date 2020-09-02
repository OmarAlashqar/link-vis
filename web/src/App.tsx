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

const App = () => {
  const [isServerError, setServerError] = useState(false);
  const [isTakingLong, setIsTakingLong] = useState(0);
  const [isPartial, setIsPartial] = useState(false);
  const { width, height } = useWindowSize();
  const [is3D, setIs3D] = useState(true);

  let [{ nodes, edges }, setData] = useState<LinkData>({
    nodes: [],
    edges: [],
  });

  const generateAlert = (isSubmitting: boolean) => {
    let alertStatus: AlertStatus = "info";
    let alertText = "";

    if (isSubmitting) {
      if (isTakingLong === 2) {
        alertText =
          "Crawling is taking longer than usual. There are so many links!";
      } else if (isTakingLong === 1) {
        alertText = "This may take a while, hold tight!";
      }
    } else if (isPartial) {
      alertText = " Crawling was cut short, this is partial data";
    } else if (isServerError) {
      alertStatus = "error";
      alertText = "Something went wrong";
    }

    return !alertText ? null : (
      <Alert status={alertStatus} mt={4}>
        <AlertIcon />
        <AlertTitle mr={2}>{alertText}</AlertTitle>
      </Alert>
    );
  };

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
          />
        </Flex>
        <Footer />
      </Flex>

      <Flex pos="absolute" top={0} mt={8} ml={8}>
        <Formik
          initialValues={{ url: "" }}
          onSubmit={async ({ url }, { setErrors }) => {
            if (!url) return;

            setServerError(false);
            setIsTakingLong(0);
            setIsPartial(false);

            let errors: FieldError[] | undefined;
            let data: LinkData | undefined;
            let partial: boolean = false;

            try {
              const timer1 = setTimeout(() => {
                setIsTakingLong(1);
              }, 5 * 1000);

              const timer2 = setTimeout(() => {
                setIsTakingLong(2);
              }, 20 * 1000);

              const response = await fetch(
                `${process.env.REACT_APP_API_URL}/crawl?seed=${encodeURI(url)}`
              );

              clearTimeout(timer1);
              clearTimeout(timer2);

              ({ errors, data, partial } = await response.json());
            } catch (err) {
              setServerError(true);
            }

            if (errors) setErrors(toErrorMap(errors));
            if (data) setData(data);

            setIsPartial(partial);
            setIsTakingLong(0);
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

                {generateAlert(isSubmitting)}
              </Flex>
            </Form>
          )}
        </Formik>
      </Flex>
    </>
  );
};

export default App;
