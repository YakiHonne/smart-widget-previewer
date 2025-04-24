# Nostr Smart Widget Previewer

A React component for previewing and interacting with Nostr-based Smart Widgets.

## Installation

```bash
npm install smart-widget-previewer
```

## Description

The Widget component renders a customizable preview of a Nostr Smart Widget, supporting various button types and user interactions. It handles image display, input fields, and multiple button actions while providing styling options and callback functions for extended functionality.

```js
import { Widget } from "smart-widget-previewer";

function App() {
  const nostrEvent = {
    // Your Nostr event object here
  };

  const handleNextWidget = (newEvent) => {
    console.log("New widget event:", newEvent);
  };

  const handleZap = (zapUrl) => {
    console.log("Zap URL:", zapUrl);
  };

  const handleNostr = (nostrUrl) => {
    console.log("Nostr URL:", nostrUrl);
  };

  const handleNostr = (appUrl) => {
    console.log("App URL:", nostrUrl);
  };

  return (
    <Widget
      event={nostrEvent}
      onNextWidget={handleNextWidget}
      onZapButton={handleZap}
      onNostrButton={handleNostr}
      onActionWidget={handleAction}
      width={300}
      widthUnit="px"
      buttonStyleClassName="custom-button"
      inputStyleClassName="custom-input"
      widgetBackgroundColor="#f0f0f0"
      widgetBorderColor="#ccc"
      widgetBorderRaduis="8"
      userHexPubkey="your-pubkey-here"
      errorMessage="Oops, invalid widget!"
    />
  );
}
```

## Props

| Prop                    | Type                           | Description                                                    | Default                  |
| ----------------------- | ------------------------------ | -------------------------------------------------------------- | ------------------------ |
| `event`                 | `object`                       | Nostr smart widget event                                       | Required                 |
| `onNextWidget`          | `(event: any) => object`       | Callback for next widget                                       | Optional                 |
| `onZapButton`           | `(url: string) => string`      | Callback for zap button clicks                                 | Optional                 |
| `onNostrButton`         | `(url: string) => string`      | Callback for nostr button clicks                               | Optional                 |
| `onActionWidget`        | `(url: string) => string`      | Callback for widget clicks when it is of type (action or tool) | Optional                 |
| `width`                 | `number`                       | Widget width                                                   | Optional                 |
| `widthUnit`             | `'px' \| 'em' \| 'rem' \| '%'` | Width unit                                                     | Optional                 |
| `buttonStyleClassName`  | `string`                       | CSS classes for buttons                                        | Optional                 |
| `inputStyleClassName`   | `string`                       | CSS classes for input                                          | Optional                 |
| `widgetBackgroundColor` | `string`                       | Background color (hex/rgb)                                     | Optional                 |
| `widgetBorderColor`     | `string`                       | Border color (hex/rgb)                                         | Optional                 |
| `widgetBorderRaduis`    | `string`                       | Border radius in pixels                                        | Optional                 |
| `userHexPubkey`         | `string`                       | User's hex public key                                          | Optional                 |
| `errorMessage`          | `string`                       | Custom error message                                           | `'Invalid Smart Widget'` |

## Features

- Displays widget image if provided
- Supports input field with custom placeholder
- Handles multiple button types:
- redirect: Opens URL in new tab
- nostr: Triggers onNostrButton callback
- zap: Triggers onZapButton callback
- post: Makes POST request and updates widget
- app: Shows embedded mini-app
- Loading state visualization
- Error handling with custom message
- Responsive width control
- Customizable styling
