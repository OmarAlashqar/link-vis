import React from "react";
import { Flex, Link, Icon } from "@chakra-ui/core";

export const footerHeight = 56;

export const Footer: React.FC = () => {
  return (
    <Flex bg="footer" p={4} bottom={0} zIndex={1} h={`${footerHeight}px`}>
      <Flex margin="auto" align="center" maxW={800} flex={1}>
        <Icon name="star" mr="2" />
        Made by Omar Alashqar
        <Icon name="arrow-forward" mx="2" />
        <Link href="https://oalashqar.me" isExternal color="teal.500">
          oalashqar.me
        </Link>
      </Flex>
    </Flex>
  );
};
