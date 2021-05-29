export function createDOM(fiber) {
  let element = document.createElement(fiber.type)
  for(let prop in fiber.props) {
    if (prop !== 'children') {
      element.setAttribute(prop, fiber.props[prop])
    }
  }
  return element
}