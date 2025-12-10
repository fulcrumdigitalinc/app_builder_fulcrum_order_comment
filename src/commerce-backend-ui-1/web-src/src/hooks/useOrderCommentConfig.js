import { useState, useEffect } from "react";
import { callAction } from "../utils";

/**
 *
 * @param props
 * @param setFormState
 */
export function useOrderCommentConfigLoader(props, setFormState) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    /**
     *
     */
    async function loadConfig() {
      try {
        const data = await callAction(props, "order-comment/admin-config", "GET");
        if (data) {
          setFormState((prevState) => ({ ...prevState, ...data.config }));
        }
        setHasError(false);
      } catch (err) {
        setHasError(true);
        console.error("Error loading config:", err);
      }
    }
    loadConfig();
  }, [props, setFormState]);

  return { hasError };
}

/**
 *
 * @param props
 */
export function useOrderCommentConfigSaver(props) {
  const [statusMsg, setStatusMsg] = useState("");
  const [hasError, setHasError] = useState(false);

  /**
   *
   * @param config
   */
  async function saveConfig(config) {
    try {
      await callAction(props, "order-comment/admin-config", "POST", config);
      setStatusMsg("Configuration saved successfully");
      setHasError(false);
    } catch (err) {
      setHasError(true);
      setStatusMsg(`Error saving config: ${err.message}`);
      console.error("Error saving config:", err);
    }
  }

  return { saveConfig, statusMsg, hasError };
}
