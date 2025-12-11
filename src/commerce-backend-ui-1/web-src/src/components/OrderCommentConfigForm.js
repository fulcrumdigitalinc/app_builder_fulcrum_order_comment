import React, { useState } from "react";
import {
  Button,
  Form,
  Heading,
  Content,
  View,
  Picker,
  Item,
  Grid,
  Text,
  ProgressCircle
} from "@adobe/react-spectrum";
import {
  useOrderCommentConfigLoader,
  useOrderCommentConfigSaver,
} from "../hooks/useOrderCommentConfig";

/**
 *
 * @param props
 */
export default function OrderCommentConfigForm(props) {
  const [formState, setFormState] = useState({
    status: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const { hasError: loadHasError } =
    useOrderCommentConfigLoader(props, setFormState);

  const {
    saveConfig,
    statusMsg: saveStatusMsg,
    hasError: saveHasError,
  } = useOrderCommentConfigSaver(props);

  const handleChange = (name, value) => {
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      await saveConfig(formState);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View padding="size-250">
      <Form maxWidth="size-6000">
        <Heading level={3} marginTop="size-200" marginBottom="size-100">
          General Configuration
        </Heading>
        <Picker
          label="Status"
          selectedKey={formState.status}
          onSelectionChange={(val) => handleChange("status", val)}
          isRequired
          isDisabled={loadHasError}
        >
          <Item key="on">Enabled</Item>
          <Item key="off">Disabled</Item>
        </Picker>

        <Button variant="accent" onPress={handleSave} isDisabled={loadHasError || isLoading}>
          {isLoading ? (
          <ProgressCircle
            aria-label="Saving..."
            isIndeterminate
            size="S"
          />
          ) : "Save"}
        </Button>

        {saveHasError && (
          <Content UNSAFE_style={{ color: "#b0b0b0" }}>
            <br />
            {saveStatusMsg}
          </Content>
        )}
      </Form>
    </View>
  );
}
