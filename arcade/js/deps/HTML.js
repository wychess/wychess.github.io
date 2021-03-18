// This file is a part of quicksave project.
// Copyright (c) 2017 Aleksander Gajewski <adiog@quicksave.io>.

function text(innerText) {
    return document.createTextNode(innerText)
}

function $DOM(elementName, elementAttributes={})
{
    let dom = document.createElement(elementName);
    for(let attributeIndex in elementAttributes)
    {
        dom.setAttribute(attributeIndex, elementAttributes[attributeIndex]);
    }
    return dom;
}

function $$(parentNode)
{
    for(let i = 1; i < arguments.length; i++)
    {
        parentNode.appendChild(arguments[i]);
    }
    return parentNode;
}

function $$$(parentNode, innerHTML)
{
    parentNode.innerHTML = innerHTML;
    return parentNode;
}

function $BIND(dom, eventName, callback)
{
    dom.addEventListener(eventName, callback);
    return dom;
}

function $SWAP(oldNode, newNode)
{
    oldNode.parentNode.replaceChild(newNode, oldNode);
}

function $DEEPSWAP(lhsNode, rhsNode)
{
    let deepSwapPivot = div();
    $SWAP(lhsNode, deepSwapPivot);
    $SWAP(rhsNode, lhsNode);
    $SWAP(deepSwapPivot, rhsNode);
}

function div(attrs)
{
    return $DOM('div', attrs);
}

function input(attrs)
{
    return $DOM('input', attrs);
}

function i(attrs)
{
    return $DOM('i', attrs);
}

function button(attrs)
{
    return $DOM('button', attrs);
}

function form(attrs)
{
    return $DOM('form', attrs);
}

function label(attrs)
{
    return $DOM('label', attrs);
}

function pre(attrs)
{
    return $DOM('pre', attrs);
}

function hr(attrs)
{
    return $DOM('hr', attrs);
}

function br(attrs)
{
    return $DOM('br', attrs);
}

function a(attrs)
{
    return $DOM('a', attrs);
}

function p(attrs)
{
    return $DOM('p', attrs);
}

function img(attrs)
{
    return $DOM('img', attrs)
}

function source(attrs)
{
    return $DOM('source', attrs);
}

function embed(attrs)
{
    return $DOM('embed', attrs);
}

function video(attrs)
{
    return $DOM('video', attrs);
}

function span(attrs)
{
    return $DOM('span', attrs);
}

function textarea(attrs)
{
    return $DOM('textarea', attrs);
}

function select(attrs)
{
    return $DOM('select', attrs);
}

function option(attrs)
{
    return $DOM('option', attrs);
}

function table(attrs)
{
    return $DOM('table', attrs);
}

function tr(attrs)
{
    return $DOM('tr', attrs);
}

function th(attrs)
{
    return $DOM('th', attrs);
}

function td(attrs)
{
    return $DOM('td', attrs);
}

function icon(name, attrs) {
    return $$(button(attrs), i({'class': name + ' icon'}))
}

function iconText(name, text, attrs) {
    return $$(button(attrs), i({'class': name + ' icon'}), $$$(span(), text))
}
function glyph(id, name, attrs={}) {
    attrs['id'] = id
    attrs['class'] = name + ' icon'
    attrs['style'] = {'color': 'darkred'}
    return i(attrs)
}


function toggleButton(text, enabled, onToggle) {
    let b = $$$(button({'style': 'opacity: ' + enabled ? "1.0" : "0.75"}), text)
    let that = this
    let localEnabled = enabled
    b.addEventListener('click', function() {
        localEnabled = !localEnabled
        b.style.opacity = localEnabled ? "1.0" : "0.75"
        onToggle(localEnabled)
    })
    return b
}

function togglePrettyButton(enableDom, disableDom, enabled, onToggle) {
    let b = $$$(button({'style': ('margin: auto; width: 100px; opacity: ' + (enabled ? "1.0" : "0.75"))}), enabled ? enableDom : disableDom)
    let that = this
    let localEnabled = enabled
    b.addEventListener('click', function() {
        localEnabled = !localEnabled
        b.style.opacity = localEnabled ? "1.0" : "0.75"
        b.innerHTML = localEnabled ? enableDom : disableDom
        onToggle(localEnabled)
    })
    return b
}
