var forEach = Array.prototype.forEach;

class CustomAttributeRegistry {
  constructor(ownerDocument){
    if(!ownerDocument) {
      throw new Error("Must be given a document");
    }

    this.ownerDocument = ownerDocument;
    this._attrs = {};
    this._elementMap = new WeakMap();
    this._observe();
  }

  define(attrName, Constructor) {
    this._attrs[attrName] = Constructor;
    this._upgrade(attrName);
  }

  get(attrName){
    return this._attrs[attrName];
  }

  _observe(){
    var customAttributes = this;
    var document = this.ownerDocument;
    var root = document.documentElement;

    this.attrMO = new MutationObserver(function(mutations){
      forEach.call(mutations, function(m){
        var attr = customAttributes.get(m.attributeName);
        if(attr) {
          customAttributes._found(m.attributeName, m.target, m.oldValue);
        }
      });
    });

    this.attrMO.observe(root, {
      subtree: true,
      attributes: true,
      attributeOldValue: true
    });

    this.childMO = new MutationObserver(function(mutations){
      var downgrade = customAttributes._downgrade.bind(customAttributes);
      forEach.call(mutations, function(m){
        forEach.call(m.removedNodes, downgrade);
      });
    });

    this.childMO.observe(root, {
      childList: true,
      subtree: true
    });
  }

  _upgrade(attrName) {
    var document = this.ownerDocument;
    var matches = document.querySelectorAll("[" + attrName + "]");
    for(var match of matches) {
      this._found(attrName, match);
    }
  }

  _downgrade(element) {
    var map = this._elementMap.get(element);
    if(!map) return;

    for(var inst of map.values()) {
      if(inst.disconnectedCallback) {
        inst.disconnectedCallback();
      }
    }

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
      var Constructor = this.get(attrName);
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
    else if(newVal == null && !!inst.value) {
      inst.value = newVal;
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

window.customAttributes = new CustomAttributeRegistry(document);
