import CustomAttributeRegistry from './registry.js'

const win = window as any
export let customAttributes: CustomAttributeRegistry

if (!win.$customAttributes?.skipPolyfill) {
	customAttributes = new CustomAttributeRegistry(document)
	win.customAttributes = customAttributes
}

export {customAttributes as default, CustomAttributeRegistry}
