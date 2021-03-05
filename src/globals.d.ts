declare global {
	const customAttributes: CustomAttributeRegistry
	interface Window {
		customAttributes: CustomAttributeRegistry
	}
}
