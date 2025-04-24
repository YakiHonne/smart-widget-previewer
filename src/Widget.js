import React, { useRef, useState, useEffect, Fragment } from "react";
import axios from "axios";
import "./Widget.css";

const getContainerWidth = (width, unit) => {
  if (!width) return "100%";
  if (typeof width !== "number") return "100%";
  if (!["px", "em", "rem", "%"].includes(unit)) return `${width}%`;
  return `${width}${unit}`;
};

const verifyEvent = (event) => {
  if (!event) {
    console.error("No event to parse");
    return false;
  }
  const { id, pubkey, created_at, kind, tags, sig } = event;
  if (!(id && pubkey && created_at && kind && tags && sig)) {
    console.error("Invalid event structure");
    return false;
  }
  let identifier = "";
  let type = "basic";
  let icon = "";
  let image = "";
  let input = "";
  let buttons = [];

  for (let tag of tags) {
    if (tag[0] === "d") identifier = tag[1];
    if (tag[0] === "l") type = tag[1];
    if (tag[0] === "icon") icon = tag[1];
    if (tag[0] === "image") image = tag[1];
    if (tag[0] === "input") input = tag[1];
    if (tag[0] === "button") {
      let button_ = {
        label: tag[1],
        type: tag[2],
        url: tag[3],
      };
      if (!button_.label) {
        console.error(
          "Invalid smart widget, the button component should have a label"
        );
        return false;
      }
      if (!["nostr", "zap", "redirect", "post", "app"].includes(button_.type)) {
        console.error(
          "Invalid smart widget, the button type should be one of these values (nostr | zap | redirect | post | app)"
        );
        return false;
      }
      if (!button_.url) {
        console.error(
          "Invalid smart widget, the button component should have a url"
        );
        return false;
      }
      buttons.push(button_);
    }
  }
  if (!image) {
    console.error(
      "Invalid smart widget, should have at least an image component"
    );
    return false;
  }
  if (type !== "basic" && (buttons.length === 0 || buttons.length > 1)) {
    console.error(
      "Invalid smart widget, smart widgets with (action | tool) type should have one valid button"
    );
    return false;
  }
  let aTag = `${kind}:${pubkey}:${identifier}`;
  return {
    id,
    type,
    icon,
    pubkey,
    kind,
    image,
    input: type !== "basic" ? "" : input,
    buttons,
    identifier,
    aTag,
  };
};

const extractRootDomain = (url) => {
  try {
    let hostname = new URL(url).hostname;
    let parts = hostname.split(".");

    if (parts.length > 2) {
      return parts[parts.length - 2];
    }
    return parts[0];
  } catch (error) {
    return url;
  }
};

/**
 * A nostr smart widget previewer
 * @param {object} event smart widget nostr event
 * @param {object} onNextWidget a callback function for when the next widget retrieved, it returns a nostr smart widget event
 * @param {callback} onZapButton a callback function for when a button is a zap type, it returns an lightning address (lud06 | lud16) or an invoice,
 * @param {callback} onNostrButton a callback function for when a button has a nostr scheme url, it returns the url
 * @param {callback} onActionWidget a callback function for when a smart widget is with (action | tool) type and being clicked, it returns the url
 * @param {number} width the width of the smart widget
 * @param {string} widthUnit the width unit (px | em | rem | %)
 * @param {string} buttonStyleClassName one or more css class names in one string to style the smart widget button
 * @param {string} inputStyleClassName one or more css class names in one string to style the smart widget input field
 * @param {string} widgetBackgroundColor a hex or an rgb string to customize the widget background color
 * @param {string} widgetBorderColor a hex or an rgb string to customize the widget border color
 * @param {string} widgetBorderRaduis the widget border radius number in pixels
 * @param {string} userHexPubkey the current connected user pubkey in a hex format
 * @param {string} errorMessage custom error message for when the widget is invalid
 * @returns
 */
export function Widget({
  event,
  onNextWidget,
  onZapButton,
  onNostrButton,
  onActionWidget,
  width,
  widthUnit,
  buttonStyleClassName,
  inputStyleClassName,
  widgetBackgroundColor,
  widgetBorderColor,
  widgetBorderRaduis,
  userHexPubkey,
  errorMessage,
}) {
  const [widget, setWidget] = useState(verifyEvent(event));
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const containerWidth = getContainerWidth(width, widthUnit);

  const handleButtonClick = async (type, url) => {
    if (widget.type !== "basic") {
      onActionWidget && onActionWidget(url);
      return;
    }
    if (type === "nostr") onNostrButton && onNostrButton(url);
    if (type === "zap") onZapButton && onZapButton(url);
    if (type === "redirect") window.open(url, "_blank");
    if (type === "app") onActionWidget && onActionWidget(url);
    if (type === "post") {
      try {
        setIsLoading(true);
        let newWidget = await axios.post(
          url,
          {
            input,
            pubkey: userHexPubkey || "",
            aTag: widget?.aTag || "",
          },
          {
            withCredentials: true,
          }
        );
        let verifiedEvent = verifyEvent(newWidget.data);
        if (verifiedEvent) {
          setWidget(verifiedEvent);
          onNextWidget && onNextWidget(newWidget.data);
          setInput("");
        }
        if (!verifiedEvent) setWidget(false);
        setIsLoading(false);
      } catch (err) {
        console.log(err);
        setIsLoading(false);
        setWidget(false);
      }
    }
  };

  if (!widget)
    return (
      <div
        style={{
          width: `min(100%, ${containerWidth})`,
          backgroundColor: widgetBackgroundColor || "#3333",
          border: widgetBorderColor ? `1px solid ${widgetBorderColor}` : "none",
          borderRadius: widgetBorderRaduis ? `${widgetBorderRaduis}px` : "10px",
        }}
        className="sw-box-pad-v sw-fx-centered"
      >
        <p>&#9888; {errorMessage || "Invalid Smart Widget"}</p>
      </div>
    );
  return (
    <>
      <div
        style={{
          width: `min(100%, ${containerWidth})`,
          backgroundColor: widgetBackgroundColor || "transparent",
          border: widgetBorderColor ? `1px solid ${widgetBorderColor}` : "none",
          borderRadius: widgetBorderRaduis ? `${widgetBorderRaduis}px` : "10px",
          overflow: "hidden",
          position: "relative",
        }}
        className={widget.type !== "basic" ? "pointer" : "sw-pointer"}
        onClick={() =>
          widget.type !== "basic"
            ? handleButtonClick(widget.buttons[0].type, widget.buttons[0].url)
            : null
        }
      >
        {isLoading && <div className="sw-screen-loader"></div>}
        <img style={{ width: "100%" }} src={widget.image} />
        <div
          style={{
            padding: ".5rem",
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "flex-start",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          {widget.input && (
            <input
              className={inputStyleClassName || "sw-if"}
              placeholder={widget.input}
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
          )}
          <div
            style={{
              gap: "8px",
            }}
            className="sw-fit-container sw-fx-centered sw-fx-scattered sw-fx-wrap"
          >
            {widget.type === "basic" &&
              widget.buttons.map((_, index) => {
                if (index < 3)
                  return (
                    <button
                      className={buttonStyleClassName || "sw-button"}
                      key={index}
                      onClick={() => handleButtonClick(_.type, _.url)}
                      style={{ flex: 1 }}
                    >
                      <p className="sw-p-one-line">{_.label}</p>
                    </button>
                  );
              })}
            {widget.type !== "basic" && (
              <button className={"sw-button-text"}>
                <p className="sw-p-one-line">{widget.buttons[0].label}</p>
              </button>
            )}
          </div>
          {widget.buttons.length > 3 && (
            <div
              style={{
                gap: "8px",
              }}
              className="sw-fit-container sw-fx-centered sw-fx-scattered sw-fx-wrap"
            >
              {widget.buttons.map((_, index) => {
                if (index > 2)
                  return (
                    <button
                      className={buttonStyleClassName || "sw-button"}
                      key={index}
                      onClick={() => handleButtonClick(_.type, _.url)}
                      style={{ flex: 1 }}
                    >
                      <p className="sw-p-one-line">{_.label}</p>
                    </button>
                  );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

const MiniApp = ({ url, exit }) => {
  const [showToast, setShowToast] = useState(false);
  const domain = extractRootDomain(url);
  const iframeRef = useRef(null);

  const copy = () => {
    navigator.clipboard.writeText(url);
    setShowToast(true);
    let timer = setTimeout(() => {
      setShowToast(false);
      clearTimeout(timer);
    }, 2000);
  };
  const reloadiFrame = () => {
    iframeRef.current.src = url;
  };

  return (
    <>
      {showToast && (
        <div
          className="sw-fit-container sw-fx-centered sw-slide-down"
          style={{ position: "fixed", left: 0, top: "10px", zIndex: 100000 }}
        >
          <div
            className="sw-box-pad-h-m sw-box-pad-v-m sw-sc-s-18"
            style={{ color: "white" }}
          >
            Link was copied
          </div>
        </div>
      )}
      <div
        className="sw-fixed-container sw-fx-centered sw-box-pad-h"
        onClick={(e) => {
          e.stopPropagation();
          exit();
        }}
      >
        <section
          className="fsw-x-centered sw-fx-col"
          style={{
            width: "400px",
            borderRadius: "10px",
            overflow: "hidden",
            backgroundColor: "#343434",
            gap: 0,
          }}
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <div className="sw-fit-container sw-box-pad-h-m sw-box-pad-v-s sw-fx-scattered">
            <div className="close" onClick={exit}>
              <div></div>
            </div>
            <p style={{ color: "white" }}>{domain}</p>
            <OptionsDropdown
              options={[
                <p
                  style={{
                    color: "white",
                    fontSize: ".8rem",
                    cursor: "pointer",
                  }}
                  onClick={copy}
                >
                  Copy link
                </p>,
                <p
                  style={{
                    color: "white",
                    fontSize: ".8rem",
                    cursor: "pointer",
                  }}
                  onClick={reloadiFrame}
                >
                  Reload app
                </p>,
              ]}
            />
          </div>
          <div className="sw-fit-container">
            <iframe
              ref={iframeRef}
              src={url}
              allow="microphone; camera; clipboard-write 'src'"
              sandbox="allow-forms allow-scripts allow-same-origin allow-popups"
              style={{ border: "none", aspectRatio: "10/16" }}
              className="sw-fit-container sw-fit-height"
            ></iframe>
          </div>
        </section>
      </div>
    </>
  );
};

const OptionsDropdown = ({ options }) => {
  const [showOptions, setShowOptions] = useState(false);
  const optionsRef = useRef(null);

  useEffect(() => {
    const handleOffClick = (e) => {
      e.stopPropagation();
      if (optionsRef.current && !optionsRef.current.contains(e.target))
        setShowOptions(false);
    };
    document.addEventListener("mousedown", handleOffClick);
    return () => {
      document.removeEventListener("mousedown", handleOffClick);
    };
  }, [optionsRef]);

  return (
    <div style={{ position: "relative" }} ref={optionsRef}>
      <div
        className={"sw-round-icon"}
        onClick={(e) => {
          e.stopPropagation();
          setShowOptions(!showOptions);
        }}
      >
        <div className={`sw-fx-centered`} style={{ gap: 0 }}>
          <p
            className="sw-fx-centered"
            style={{ height: "6px", color: "white" }}
          >
            &#x2022;
          </p>
          <p
            className="sw-fx-centered"
            style={{ height: "6px", color: "white" }}
          >
            &#x2022;
          </p>
          <p
            className="sw-fx-centered"
            style={{ height: "6px", color: "white" }}
          >
            &#x2022;
          </p>
        </div>
      </div>
      {showOptions && (
        <div
          style={{
            position: "absolute",
            top: "110%",
            right: "0",
            backgroundColor: "#2f2f2f",
            border: "none",
            minWidth: "100px",
            width: "max-content",
            zIndex: 1000,
            borderRadius: "10px",
            gap: "14px",
          }}
          className="sw-box-pad-h-m sw-box-pad-v-s sw-sc-s-18 sw-fx-centered sw-fx-col sw-fx-start-v sw-pointer"
        >
          {options.map((option, index) => {
            return <Fragment key={index}>{option}</Fragment>;
          })}
        </div>
      )}
    </div>
  );
};
