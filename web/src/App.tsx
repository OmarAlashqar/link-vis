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

const App = () => {
  const [isServerError, setServerError] = useState(false);
  const [isTakingLong, setIsTakingLong] = useState(false);
  const { width, height } = useWindowSize();
  const [is3D, setIs3D] = useState(true);

  let [{ nodes, edges }, setData] = useState<LinkData>({
    nodes: [],
    edges: [],
  });

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

            let errors: FieldError[] | undefined;
            let data: LinkData | undefined;

            try {
              const timer = setTimeout(() => {
                setIsTakingLong(true);
              }, 10 * 1000);

              const response = await fetch(
                `${process.env.REACT_APP_API_URL}/crawl?seed=${encodeURI(url)}`
              );

              clearTimeout(timer);

              ({ errors, data } = await response.json());
            } catch (err) {
              setServerError(true);
            }

            if (errors) setErrors(toErrorMap(errors));
            else if (data) setData(data);

            setIsTakingLong(false);
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

                {/* Generic alert */}
                {!isServerError && isSubmitting && !isTakingLong && (
                  <Alert status="info" mt={4}>
                    <AlertIcon />
                    <AlertTitle mr={2}>
                      This may take a while, hold tight!
                    </AlertTitle>
                  </Alert>
                )}

                {/* Taking long alert */}
                {!isServerError && isSubmitting && isTakingLong && (
                  <Alert status="info" mt={4}>
                    <AlertIcon />
                    <AlertTitle mr={2}>
                      Crawling is taking longer than usual. There are so many
                      links!
                    </AlertTitle>
                  </Alert>
                )}

                {/* Server error alert */}
                {isServerError && (
                  <Alert status="error" mt={4}>
                    <AlertIcon />
                    <AlertTitle mr={2}>Something went wrong</AlertTitle>
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
