import {CustomAttributeRegistry} from './registry.js'

const win = window as any
export let customAttributes: CustomAttributeRegistry

if (!win.$customAttributes?.skipPolyfill) {
	customAttributes = new CustomAttributeRegistry(document)
	win.customAttributes = customAttributes
}

export * from './registry.js'

export const version = '0.1.1'
