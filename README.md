[![Build Status](https://travis-ci.org/matthewp/custom-attributes.svg?branch=master)](https://travis-ci.org/matthewp/custom-attributes)
[![npm version](https://badge.fury.io/js/custom-attributes.svg)](http://badge.fury.io/js/custom-attributes)

# custom-attributes

Define custom attributes in the same way you can define custom elements, which allows for rich mixin types of behaviors on elements.

## Install

```shell
npm install custom-attributes --save
```

Add as a script tag:

```html
<script src="node_modules/custom-attributes/attr.js" defer></script>
```

Or import as an ES module:

```js
import customAttributes from 'custom-attributes';
```

Or you can just import the CustomAttributeRegistry and create your own instance:

```js
import CustomAttributeRegistry from 'custom-attributes/registry';

const customAttributes = new CustomAttributeRegistry(document);
```

## Example

```html
<article bg-color="green">
  <p>This will be shown in a green background!</p>
</article>
```

```js
class BgColor {
  connectedCallback() {
    this.setColor();
  }

  disconnectedCallback() {
    // cleanup here!
  }

  // Called whenever the attribute's value changes
  changedCallback() {
    this.setColor();
  }

  setColor() {
    this.ownerElement.style.backgroundColor = this.value;
  }
}

customAttributes.define('bg-color', BgColor);
```

## API

custom-attributes follows a very similar API as v1 custom elements, but rather than a class instance representing the host element, the class instance is meant to represent the *attribute*.

### Lifecycle callbacks

#### connectedCallback

This is called when the attribute is first connected to the `document`. If the host element is already in the DOM, and the attribute is set, connectedCallback will be called as all registered attributes are upgraded.

If the host element is already in the DOM and the attribute is programmatically added via `setAttribute`, then connectedCallback will be called asynchronously after.

If the host element is being programmatically created and the attribute is set before the element is inserted into the DOM, connectedCallback will only call when the host element is inserted.

#### disconnectedCallback

Called when the attribute is no longer part of the host element, or the host document. This callback should be used if any cleanup is needed.

If the attribute is removed via `removeAttribute`, then disconnectedCallback will be called asynchronously after this change. If the host element is removed from the DOM, disconnectedCallback will be called asynchronously after as well.

#### changedCallback

Called any time the attribute's `value` changes, after connected. Useful if you need to perform work based on the attribute value such as the example given in this readme.

### Properties

#### ownerElement

`this.ownerElement` refers to the element which the attribute is attached.

#### name

The attribute's name. Since multiple class definitions can be used for multiple attribute names, `this.name` is useful if you need to know what the attribute is being referred to as.

#### value

The current value of the attribute (the string value) is available as `this.value`.

## License

BSD 2 Clause
