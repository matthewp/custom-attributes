import type {Constructor} from 'lowclass'

const forEach = Array.prototype.forEach

export interface CustomAttribute {
	ownerElement: Element
	name: string
	value: string
	connectedCallback?(): void
	disconnectedCallback?(): void
	changedCallback?(oldValue: string, newValue: string): void
}

export class CustomAttributeRegistry {
	private _attrMap = new Map<string, Constructor>()
	private _elementMap = new WeakMap<Element, Map<string, CustomAttribute>>()

	constructor(public ownerDocument: Document | ShadowRoot) {
		if (!ownerDocument) throw new Error('Must be given a document')

		this._observe()
	}

	define(attrName: string, Class: Constructor) {
		this._attrMap.set(attrName, Class)
		this._upgradeAttr(attrName)
	}

	get(element: Element, attrName: string) {
		const map = this._elementMap.get(element)
		if (!map) return
		return map.get(attrName)
	}

	private _getConstructor(attrName: string) {
		return this._attrMap.get(attrName)
	}

	private _observer!: MutationObserver

	private _observe() {
		const root = this.ownerDocument
		const disconnected = this._elementDisconnected.bind(this)
		const connected = this._elementConnected.bind(this)

		this._observer = new MutationObserver(mutations => {
			forEach.call(mutations, (m: MutationRecord) => {
				if (m.type === 'attributes') {
					const attr = this._getConstructor(m.attributeName!)
					if (attr) this._handleChange(m.attributeName!, m.target as Element, m.oldValue)
				}
				// chlidList
				else {
					forEach.call(m.removedNodes, disconnected)
					forEach.call(m.addedNodes, connected)
				}
			})
		})

		this._observer.observe(root, {childList: true, subtree: true, attributes: true, attributeOldValue: true})
	}

	private _upgradeAttr(attrName: string, node: Element | Document | ShadowRoot = this.ownerDocument) {
		const matches = node.querySelectorAll('[' + attrName + ']')

		// Possibly create custom attributes that may be in the given 'node' tree.
		// Use a forEach as Edge doesn't support for...of on a NodeList
		forEach.call(matches, (element: Element) => this._handleChange(attrName, element, null))
	}

	private _elementConnected(element: Element) {
		if (element.nodeType !== 1) return

		// For each of the connected element's attribute, possibly instantiate the custom attributes.
		// Use a forEach as Safari 10 doesn't support for...of on NamedNodeMap (attributes)
		forEach.call(element.attributes, (attr: Attr) => {
			if (this._getConstructor(attr.name)) this._handleChange(attr.name, element, null)
		})

		// Possibly instantiate custom attributes that may be in the subtree of the connected element.
		this._attrMap.forEach((_constructor, attr) => this._upgradeAttr(attr, element))
	}

	private _elementDisconnected(element: Element) {
		const map = this._elementMap.get(element)
		if (!map) return

		map.forEach(inst => inst.disconnectedCallback?.(), this)

		this._elementMap.delete(element)
	}

	private _handleChange(attrName: string, el: Element, oldVal: string | null) {
		let map = this._elementMap.get(el)
		if (!map) this._elementMap.set(el, (map = new Map()))

		let inst = map.get(attrName)
		const newVal = el.getAttribute(attrName)

		if (!inst) {
			const Constructor = this._getConstructor(attrName)!
			inst = new Constructor() as CustomAttribute
			map.set(attrName, inst)
			inst.ownerElement = el
			inst.name = attrName
			if (newVal == null) throw new Error('Not possible!')
			inst.value = newVal
			inst.connectedCallback?.()
			return
		}

		// Attribute was removed
		if (newVal == null) {
			inst.disconnectedCallback?.()
			map.delete(attrName)
		}

		// Attribute changed
		else if (newVal !== inst.value) {
			inst.value = newVal
			if (oldVal == null) throw new Error('Not possible!')
			inst.changedCallback?.(oldVal, newVal)
		}
	}
}

export default CustomAttributeRegistry
