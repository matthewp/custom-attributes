[![Build Status](https://travis-ci.org/matthewp/custom-attributes.svg?branch=master)](https://travis-ci.org/matthewp/custom-attributes)
[![npm version](https://badge.fury.io/js/custom-attributes.svg)](http://badge.fury.io/js/custom-attributes)

# custom-attributes

Define custom attributes in the same way you can define custom elements, which allows for rich mixin types of behaviors on elements.

## Install

```shell
npm install custom-attributes --save
```

```html
<script src="node_modules/custom-attributes/attr.js" defer></script>
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

## License

BSD 2 Clause
