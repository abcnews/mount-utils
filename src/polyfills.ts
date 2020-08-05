// Polyfill Element.prototype.matches, if required
if (!Element.prototype.matches) {
  Element.prototype.matches =
    // @ts-ignore: Property 'msMatchesSelector' does not exist on type 'Element'
    Element.prototype.msMatchesSelector ||
    Element.prototype.webkitMatchesSelector;
}
