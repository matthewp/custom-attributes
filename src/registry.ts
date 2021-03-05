import type {Constructor} from 'lowclass'

var forEach = Array.prototype.forEach

interface CustomAttribute {
	ownerElement: Element
	name: string
	value: string | null
	connectedCallback?(): void
	disconnectedCallback?(): void
	changedCallback?(oldValue: string | undefined, newValue: string): void
}

class CustomAttributeRegistry {
	_attrMap = new Map<string, Constructor>()
	_elementMap = new WeakMap<Element, Map<string, CustomAttribute>>()

	constructor(public ownerDocument: Document | ShadowRoot) {
		if (!ownerDocument) throw new Error('Must be given a document')

		this._observe()
	}

	define(attrName: string, Class: Constructor) {
		this._attrMap.set(attrName, Class)
		this._upgradeAttr(attrName)
	}

	get(element: Element, attrName: string) {
		var map = this._elementMap.get(element)
		if (!map) return
		return map.get(attrName)
	}

	_getConstructor(attrName: string) {
		return this._attrMap.get(attrName)
	}

	observer!: MutationObserver

	_observe() {
		var customAttributes = this
		var root = this.ownerDocument
		var downgrade = this._downgrade.bind(this)
		var upgrade = this._upgradeElement.bind(this)

		this.observer = new MutationObserver(mutations => {
			forEach.call(mutations, (m: MutationRecord) => {
				if (m.type === 'attributes') {
					var attr = customAttributes._getConstructor(m.attributeName!)
					if (attr) customAttributes._found(m.attributeName!, m.target as Element, m.oldValue!)
				}
				// chlidList
				else {
					forEach.call(m.removedNodes, downgrade)
					forEach.call(m.addedNodes, upgrade)
				}
			})
		})

		this.observer.observe(root, {childList: true, subtree: true, attributes: true, attributeOldValue: true})
	}

	// TODO I'm not sure if document has the correct type. But the JavaScript works.
	_upgradeAttr(attrName: string, document: Element | Document | ShadowRoot = this.ownerDocument) {
		var matches = document.querySelectorAll('[' + attrName + ']')

		// Use a forEach as Edge doesn't support for...of on a NodeList
		forEach.call(matches, (match: Element) => this._found(attrName, match))
	}

	_upgradeElement(element: Element) {
		if (element.nodeType !== 1) return

		// Use a forEach as Safari 10 doesn't support for...of on NamedNodeMap (attributes)
		forEach.call(element.attributes, (attr: Attr) => {
			if (this._getConstructor(attr.name)) this._found(attr.name, element)
		})

		this._attrMap.forEach((_constructor, attr) => this._upgradeAttr(attr, element))
	}

	_downgrade(element: Element) {
		var map = this._elementMap.get(element)
		if (!map) return

		map.forEach(inst => inst.disconnectedCallback?.(), this)

		this._elementMap.delete(element)
	}

	_found(attrName: string, el: Element, oldVal?: string) {
		var map = this._elementMap.get(el)
		if (!map) this._elementMap.set(el, (map = new Map()))

		var inst = map.get(attrName)
		var newVal = el.getAttribute(attrName)
		if (!inst) {
			var Constructor = this._getConstructor(attrName)!
			inst = new Constructor() as CustomAttribute
			map.set(attrName, inst)
			inst.ownerElement = el
			inst.name = attrName
			inst.value = newVal
			inst.connectedCallback?.()
		}
		// Attribute was removed
		else if (newVal == null) {
			inst.disconnectedCallback?.()
			map.delete(attrName)
		}
		// Attribute changed
		else if (newVal !== inst.value) {
			inst.value = newVal
			inst.changedCallback?.(oldVal, newVal)
		}
	}
}

export default CustomAttributeRegistry
