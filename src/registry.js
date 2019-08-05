var forEach = Array.prototype.forEach;

class CustomAttributeRegistry {
  constructor(ownerDocument){
    if(!ownerDocument) {
      throw new Error("Must be given a document");
    }

    this.ownerDocument = ownerDocument;
    this._attrMap = new Map();
    this._elementMap = new WeakMap();
    this._observe();
  }

  define(attrName, Constructor) {
    this._attrMap.set(attrName, Constructor);
    this._upgradeAttr(attrName);
  }

  get(element, attrName) {
    var map = this._elementMap.get(element);
    if(!map) return;
    return map.get(attrName);
  }

  _getConstructor(attrName){
    return this._attrMap.get(attrName);
  }

  _observe(){
    var customAttributes = this;
    var root = this.ownerDocument;
    var downgrade = this._downgrade.bind(this);
    var upgrade = this._upgradeElement.bind(this);

    this.observer = new MutationObserver(function(mutations){
      forEach.call(mutations, function(m){
        if(m.type === 'attributes') {
          var attr = customAttributes._getConstructor(m.attributeName);
          if(attr) {
            customAttributes._found(m.attributeName, m.target, m.oldValue);
          }
        }
        // chlidList
        else {
          forEach.call(m.removedNodes, downgrade);
          forEach.call(m.addedNodes, upgrade);
        }
      });
    });

    this.observer.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeOldValue: true
    });
  }

  _upgradeAttr(attrName, document) {
    document = document || this.ownerDocument;

    var matches = document.querySelectorAll("[" + attrName + "]");

    // Use a forEach as Edge doesn't support for...of on a NodeList
    forEach.call(matches, function(match) {
      this._found(attrName, match);
    }, this);
  }

  _upgradeElement(element) {
    if(element.nodeType !== 1) return;

    // Use a forEach as Safari 10 doesn't support for...of on NamedNodeMap (attributes)
    forEach.call(element.attributes, function(attr) {
      if(this._getConstructor(attr.name)) {
        this._found(attr.name, element);
      }
    }, this);

    this._attrMap.forEach(function(constructor, attr) {
      this._upgradeAttr(attr, element);
    }, this);
  }

  _downgrade(element) {
    var map = this._elementMap.get(element);
    if(!map) return;

    map.forEach(function(inst) {
      if (inst.disconnectedCallback) {
        inst.disconnectedCallback();
      }
    }, this);

    this._elementMap.delete(element);
  }

  _found(attrName, el, oldVal) {
    var map = this._elementMap.get(el);
    if(!map) {
      map = new Map();
      this._elementMap.set(el, map);
    }

    var inst = map.get(attrName);
    var newVal = el.getAttribute(attrName);
    if(!inst) {
      var Constructor = this._getConstructor(attrName);
      inst = new Constructor();
      map.set(attrName, inst);
      inst.ownerElement = el;
      inst.name = attrName;
      inst.value = newVal;
      if(inst.connectedCallback) {
        inst.connectedCallback();
      }
    }
    // Attribute was removed
    else if(newVal == null) {
      if(inst.disconnectedCallback) {
        inst.disconnectedCallback();
      }

      map.delete(attrName);
    }
    // Attribute changed
    else if(newVal !== inst.value) {
      inst.value = newVal;
      if(inst.changedCallback) {
        inst.changedCallback(oldVal, newVal);
      }
    }

  }
}

export default CustomAttributeRegistry;
