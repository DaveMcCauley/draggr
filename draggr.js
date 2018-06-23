/* eslint-disable */
console.log("LOADED draggr.js (loco copy in /vue-draggr/ folder");

(function draggrModule(factory) {
  "use strict";

  // export it if you can!
  if(typeof define === "function" && define.amd) {
    define(factory);
  }
  else if(typeof module != "undefined" && typeof module.exports != "undefined") {
    module.exports = factory();
  }
  else {
    window["Draggr"] = factory();
  }
})(function draggrFactory() {
  "use strict";

  if(typeof window === "undefined" || !window.document) {
    return function draggrError() {
      throw new Error("Draggr.js requires a window with a document");
    };
  }

  var dropzoneEl,
    parentEl,
    ghostEl,
    rootEl,
    moveEl,
    prevEl,
    dragStartX,
    dragStartY,
    dropChild,
    oldIndex, // TOOD:
    newIndex, // TODO:
    touchEvt,
    loopId,
    lastX,
    lastY,
    expando = 'Draggr' + (new Date).getTime(),
    R_SPACE = /\s+/g;


  function Draggr(el, options) {
    if(!(el && el.nodeType && el.nodeType === 1)) {
      throw 'Draggr: \'el\' must be an HTMLElement, and not ' + {}.toString.call(el);
    }

    this.el = el;
    this.options = options = _extend({}, options);

    el[expando] = this;

    var defaults = {
      ghostClass: 'draggr-ghost',
      dropzoneClass: 'draggr-dropzone',
      dragClass: 'draggr-drag',
      parentClass: 'draggr-parent',
      childClass: 'draggr-child',
      childShift: 50
    }

    for(var name in defaults) {
      !(name in options) && (options[name] = defaults[name]);
    }

    // bind all the private methods, by name so we don't have any problems
    // referring to the right "this" when we alos bind to an HTMLElement.
    for (var fn in this) {
      if (fn.charAt(0) === '_' && typeof this[fn] === 'function') {
        this[fn] = this[fn].bind(this);
      }
    }

    // TODO: REMOVE IT"S JUST FOR DEBUGGING
    this._onDispatch = this._onDispatch.bind(this);

    // TODO: Consider binding only on tap/drag start?
    // bind the events to el
    this._bindEvents(el);

  }


  Draggr.prototype = {
    constructor: Draggr,

    _bindEvents: function(el) {
      el.addEventListener('dragstart', this._onDragStart, false);
      el.addEventListener('dragover', this._onDragOver, false);
      el.addEventListener('dragleave', this._onDragLeave, false);
      el.addEventListener('dragend', this._onDragEnd, false);
      el.addEventListener('drop', this._onDrop, false);

      el.addEventListener('touchstart', this._onTouchStart, true);
      el.addEventListener('touchmove', this._onTouchMove, true);
      el.addEventListener('touchend', this._onTouchEnd, true);
      el.addEventListener('touchcancel', this._onTouchCancel, true);

    // TODO: REMOVE IT'S JUST FOR DEBUGGING....
      el.addEventListener('choose', this._onDispatch, true);
      el.addEventListener('add', this._onDispatch, true);
      el.addEventListener('remove', this._onDispatch, true);
      el.addEventListener('sort', this._onDispatch, true);
      el.addEventListener('update', this._onDispatch, true);
      el.addEventListener('end', this._onDispatch, true);
      el.addEventListener('move', this._onDispatch, true);
    ///////////////////////////////////////////////////////

    },

  // TODO: REMOVE IT's FOR DEBUGGING....
    _onDispatch: function(evt) {
      console.log("_onDispatch:", evt.type, " ", evt);
    },
  //////////////////////////////////////////////////////

    _dragTouchStart: function (evt, touch) {
      dropChild = false;
      moveEl = evt.target;
      prevEl = evt.target.previousElementSibling;
      _toggleClass(prevEl, 'draggr-prevEl', true);
      // for debug;

      rootEl = parentEl = evt.target.parentElement;

      oldIndex = _index(evt.target);

      if(!touch) {
        dragStartX = evt.clientX;
        dragStartY = evt.clientY;
      }
      else {
        dragStartX = evt.touches[0].clientX
        dragStartY = evt.touches[0].clientY
      }

      if(!ghostEl) {
        let rect = moveEl.getBoundingClientRect()
        ghostEl = evt.target.cloneNode(true);
        rootEl.appendChild(ghostEl);
        ghostEl.style.top = rect.top + 'px';
        ghostEl.style.left = rect.left + 'px';
        ghostEl.style.width = rect.width + 'px';
        ghostEl.style.height = rect.height + 'px';
        ghostEl.style.position = 'fixed';
        ghostEl.style.pointerEvents = 'none';
        _toggleClass(ghostEl, this.options.ghostClass, true);
      }

      if(!dropzoneEl) {
        let rect = moveEl.getBoundingClientRect();
        dropzoneEl = evt.target.cloneNode(true);
        rootEl.insertBefore(dropzoneEl, moveEl.nextElementSibling);
        _toggleClass(dropzoneEl, this.options.dropzoneClass, true);
      }

      _dispatchEvent(this, rootEl, 'choose', moveEl, rootEl, rootEl, oldIndex, evt);

      console.log("\n\nDISPATCHING THE 'start' EVENT")
      console.log("draggr.js:methods:_dragTouchStart");
      console.log("  this:", this);
      console.log("  evt:", evt);

      _dispatchEvent(this, rootEl, 'start', moveEl, moveEl, oldIndex, evt);

      // This is tricky. If we set the opacity to 0, dragEnd will get
      // called. If we don't handle it, we will get two drag images
      // (native + our ghost). But if we set it to reallllly light,
      // the native interface gets called on the super light image, so
      // that hides (for all practical purpose) the native drag image.
      // We set the other visibility properties in the drag handler to
      // avoid having dragEnd called as the position and other properties
      // update.

      moveEl.style.opacity = '0.0001';

      if(touch) {
        moveEl.style.position = 'absolute';
        moveEl.style.zIndex = '-9999';
      }

      _toggleClass(moveEl, 'moveEl', true);

    },



    _onDragStart: function(evt) {
      this._dragTouchStart(evt);
      evt.dataTransfer.effectAllowed = 'move';
      evt.dataTransfer.setData('text/html', 'Ungabunga');
    },



    _onTouchStart: function(evt) {
      evt.preventDefault();
      this._dragTouchStart(evt, true);
      // TODO: provide option for interval
      loopId = setInterval(this._emulateDrag, 50);
    },



    _dragTouchDrag: function(target, currentX, currentY) {

      if(!target) return;

      // turn off display ONLY after drag starts.
      if(!moveEl.style.display) {
        moveEl.style.display = 'none';
        return;
      }

      // move the ghost
      let dx = currentX - dragStartX;
      let dy = currentY - dragStartY;
      ghostEl.style.transform = "translate(" + dx + "px, " + dy + "px)";
      lastX = currentX;
      lastY = currentY;

      // they have to share the same parent, otherwise they could be parent/child,
      // or we have moved to a different list altogether.
      if(target.parentNode === parentEl) {
        // now if we're NOT over dragzone, we move above or below the
        // dragged item.
        if(target !== dropzoneEl && target !== moveEl) {
          var rect = target.getBoundingClientRect();
          // try it with half/half
          var next = (currentY - rect.top)/(rect.bottom - rect.top) > .5;
          // yes, it needs to be like this to debounce it.
          if(next && !dropzoneEl.contains(target.parentNode)) {
            // move it down.
            target.parentNode.insertBefore(dropzoneEl, target.nextSibling || null);
            let oldEl = prevEl;
            prevEl = _closestItem(dropzoneEl);
            if(oldEl !== prevEl) {
              _toggleClass(oldEl, 'draggr-prevEl', false);
              _toggleClass(prevEl, 'draggr-prevEl', true);
            }
          }
          else if(!next && !dropzoneEl.contains(target.parentNode)) {
            target.parentNode.insertBefore(dropzoneEl, target || null);
            let oldEl = prevEl;
            prevEl = _closestItem(dropzoneEl);
            if(oldEl !== prevEl) {
              _toggleClass(oldEl, 'draggr-prevEl', false);
              _toggleClass(prevEl, 'draggr-prevEl', true);
            }

          }

        } else {
        // if we *are* over the dropzone, we just update the prevEl. And we need
        // to do this because the update doesn't gurantee it works w/frame rate, etc.
          let oldEl = prevEl;
          prevEl = _closestItem(dropzoneEl);
          if(oldEl !== prevEl) {
            _toggleClass(oldEl, 'draggr-prevEl', false);
            _toggleClass(prevEl, 'draggr-prevEl', true);
          }
        }

      }
      else {
        // we've switched parents. Updat the parentEl.
        parentEl = target.parentNode;
        return;
      }

      // bump right if we are on the dropzone element and X > 50px offset from the side
      // we're going to be inserting the moveEl as a child of the preceding
      // element when (if?) we drop it.
      if(target === dropzoneEl) {
        // don't add child if at the top of the list!
        // TODO: replace dropzoneEl with prevEl
        if((currentX > dragStartX + this.options.childShift) && dropzoneEl.previousElementSibling) {
          dropzoneEl.style.marginLeft = this.options.childShift + "px";
          dropChild = true;
        }
        else if((currentX > dragStartX) && dropzoneEl.previousElementSibling) { //debounces the shift.
          // TODO: handle classes
          return;
        }
        else {
          dropzoneEl.style.marginLeft = "";
          dropChild = false;
        }
        // TODO: if 50px to left... bump to parent?
      }
    },



    _onDragOver: function(evt) {
      evt.preventDefault();
      if(!moveEl || !ghostEl) // something dragged from outside!
        return;
      // TODO: test for new point?
      ghostEl.style.display = 'none';

      let target = document.elementFromPoint(evt.clientX, evt.clientY);
      this._dragTouchDrag(target, evt.clientX, evt.clientY);
      ghostEl.style.display = '';
    },


    _onTouchMove: function(evt) {
      evt.preventDefault();
      touchEvt = evt.touches ? evt.touches[0] : evt;
    },


    _emulateDrag: function(evt) {
      if(touchEvt) {
        if(this.lastX === touchEvt.clientX && this.lastY === touchEvt.clientY) {
          return;
        }

        ghostEl.style.display = 'none';
        let target = document.elementFromPoint(touchEvt.clientX, touchEvt.clientY);
        this._dragTouchDrag(target, touchEvt.clientX, touchEvt.clientY);
        ghostEl.style.display = '';

      }
    },


    _dragTouchDrop: function(target, evt) {

      // TODO: REFACTOR to use closure-scoped prevEl rather than local.

      if(target === dropzoneEl) {
        if(dropChild) {
          // let prevEl = dropzoneEl.previousSibling;  // needs to be 'closest'
          let prevEl = dropzoneEl.previousElementSibling;

          prevEl = _closestItem(target);

          // can't make it a child of itself and it needs a predecessor!
          //if(!(prevEl === moveEl) && prevEl.classList.contains('draggr-item')) {
          if(prevEl) {
            let childs = prevEl.querySelector(".draggr .children");
            if (childs) {
              // TODO: don't add if childs already contains the moveEl
              childs.appendChild(moveEl);
              // call teh move event handler
              let moveRect = moveEl.getBoundingClientRect();
              let targetRect = target.getBoundingClientRect();
              _onMove(rootEl, this.el, moveEl, moveRect, target, targetRect, evt);
            }
          }
        }
        else {
          if(dropzoneEl) {
            dropzoneEl.parentNode.insertBefore(moveEl, dropzoneEl);
            let moveRect = moveEl.getBoundingClientRect();
            let targetRect = target.getBoundingClientRect();
            _onMove(rootEl, this.el, moveEl, moveRect, target, targetRect, evt);
          }
        }

        if(rootEl !== parentEl) {
          newIndex = _index(dropzoneEl);
          console.log("  >>>>  dispatching the add/remove events");
          console.log("  newIndex: ", newIndex);
          _dispatchEvent(this, parentEl, 'add', moveEl, parentEl, rootEl, oldIndex, newIndex, evt); // dont' think I need the original event?
         _dispatchEvent(this, rootEl, 'remove', moveEl, parentEl, rootEl, oldIndex, newIndex, evt);
          _dispatchEvent(this, parentEl, 'sort', moveEl, parentEl, rootEl, oldIndex, newIndex, evt);
          _dispatchEvent(this, rootEl, 'sort', moveEl, parentEl, rootEl, oldIndex, newIndex, evt);
        }
        else {
          newIndex = _index(dropzoneEl);
          console.log("  >>>>  dispatching an update event");
          _dispatchEvent(this, rootEl, 'update', moveEl, parentEl, rootEl, oldIndex, newIndex, evt);
          _dispatchEvent(this, rootEl, 'sort', moveEl, parentEl, rootEl, oldIndex, newIndex, evt);
        }
      }

      // remove the ghost, we're done moving.
      if(ghostEl && ghostEl.parentElement) {
        ghostEl.parentElement.removeChild(ghostEl);
      }

      // remove the dropzone from the parent, we dont' need it anymore.
      if(dropzoneEl && dropzoneEl.parentElement) {
        dropzoneEl.parentElement.removeChild(dropzoneEl);
        dropzoneEl = null;
      }

      // show the moved element!
      if(moveEl) {
        moveEl.style.visibility = '';
        moveEl.style.position = '';
        moveEl.style.zIndex = '';
        moveEl.style.opacity = '';
        moveEl.style.display = '';
        _toggleClass(moveEl, 'moveEl', false);
      }

      // reset prev el
      if(prevEl) {
        _toggleClass(prevEl, 'draggr-prevEl', false);
      }

      _dispatchEvent(this, rootEl, 'end', moveEl, parentEl, rootEl, oldIndex, newIndex, evt);

    },



    _onDrop: function(evt) {
      evt.preventDefault(); // Necessary. Prevents redirect of doom!

      if(!moveEl || !ghostEl) // something dragged from outside!
        return;

      // TODO: test for new point?
      ghostEl.style.display = 'none';
      let target = document.elementFromPoint(evt.clientX, evt.clientY);
      this._dragTouchDrop(target, evt);
      this._nullify();
    },



    _onTouchEnd: function(evt) {
      evt.preventDefault();
      // stop the emulated drag!
      clearInterval(loopId);
      if(ghostEl) ghostEl.style.display = 'none';
      let target = document.elementFromPoint(evt.changedTouches[0].clientX, evt.changedTouches[0].clientY);
      this._dragTouchDrop(target, evt);
      this._nullify();
    },



    _onDragLeave: function(evt) {
      //console.log("_onDragLeave:", evt);
      /*if(evt.target.className === 'draggr' && dropzoneEl && dropzoneEl.parentElement) {
        dropzoneEl.parentElement.removeChild(dropzoneEl);
      }*/
      //console.log("onDragLeave:", evt);
    },



    _onDragEnd: function(evt) {

      //TODO: DEBUG
      console.log("\n\n\ndraggr.js:methods:_onDragEnd", evt);

      // remove the ghost, we're done moving.
      if(ghostEl && ghostEl.parentElement) {
        ghostEl.parentElement.removeChild(ghostEl);
      }

      // remove the dropzone from the parent, we dont' need it anymore.
      if(dropzoneEl && dropzoneEl.parentElement) {
        dropzoneEl.parentElement.removeChild(dropzoneEl);
        dropzoneEl = null;
      }

      // show the moved element!
      if(moveEl) {
        moveEl.style.visibility = '';
        moveEl.style.position = '';
        moveEl.style.zIndex = '';
        moveEl.style.opacity = '';
        moveEl.style.display = '';
      }

      this._nullify();

    },



    _onTouchCancel: function(evt) {
      evt.preventDefault();
      //console.log("touchCancel: called");
    },



    _nullify: function() {
      console.log("draggr.js:methods:_nullify  >>>>>>>>>>>>>>>>>>>>>>>>>");
      moveEl = null;
      dropzoneEl = null;
      ghostEl = null;
      dragStartX = dragStartY = undefined;
      touchEvt = null;
      loopId = undefined;
      lastX = lastY = undefined;
      parentEl = null;
      rootEl= null;
      prevEl = null;
      dropChild = false;
      oldIndex = newIndex = undefined; // TOOD:
      touchEvt = null;
    }

  } // END OF PROTOTYPE  ///////////////////////////////////////////////////////


  function _dispatchEvent(draggr, rootEl, name, targetEl, toEl, fromEl, startIndex, newIndex, originalEvt) {

    draggr = (draggr || rootEl[expando]);

    let evt = document.createEvent('Event'),
        options = draggr.options,
        onName = 'on' + name.charAt(0).toUpperCase() + name.substr(1);

    evt.initEvent(name, true, true);

    evt.to = toEl || rootEl;
    evt.from = fromEl || rootEl;
    evt.item = targetEl || rootEl;
    evt.clone = null; // don't support cloning, but keep for API compatability.
    evt.oldIndex = startIndex;
    evt.newIndex = newIndex;
    evt.originalEvent = originalEvt;

    rootEl.dispatchEvent(evt);

    if(options[onName]) {
      options[onName].call(draggr, evt);
    }
  }


  function _onMove(fromEl, toEl, dragEl, dragRect, targetEl, targetRect, originalEvt, willInsertAfter) {
    let evt,
        draggr = fromEl[expando],
        onMoveFn = draggr.options.onMove,
        retVal;

    evt = document.createEvent('Event');
    evt.initEvent('move', true, true);

    evt.to = toEl;
    evt.from = fromEl;
    evt.dragged = dragEl;
    evt.draggedRect = dragRect;
    evt.related = targetEl || toEl;
    evt.relatedRect = targetRect || toEl.getBoundingClientRect();
    evt.willInsertAfter = willInsertAfter;
    evt.originalEvent = originalEvt;

    fromEl.dispatchEvent(evt);

    if(onMoveFn) {
      retVal = onMoveFn.call(draggr, evt, originalEvt);
    }
    return retVal;
  }


  function _index(el) {
    let i = 0;

    if(!el || !el.parentNode) {
      return -1;
    }

    while(el && (el = el.previousElementSibling)) {
      if(_matches(el, '.draggr-item') && el !== moveEl && el !== dropzoneEl) {
        i++;
      }
    }

    return i;
  }


  function _toggleClass(el, name, state) {
    if(el) {
      if(el.classList) {
        el.classList[state ? 'add' : 'remove'](name);
      }
      else {
        var className = (' ' + el.className + ' ').replace(R_SPACE, ' ').replace(' ' + name + ' ', ' ');
        el.className = (className + (state ? ' ' + name : '')).replace(R_SPACE, ' ');
      }
    }
  }


  function _matches(el, selector) {
    // wrap in fx to handle the failed case, and also IE's
    // goofy implementation.
    if(el) {
      try{
        if(el.matches) {
          return el.matches(selector);
        } else if(el.msMatchesSelector) { // fracking IE
          return el.msMatchesSelector(selector);
        }
      } catch (e) {
        return false;
      }
    }
    return false;
  }


  function _extend(dest, src) {
    if (dest && src) {
      for (var key in src) {
        if (src.hasOwnProperty(key)) {
          dest[key] = src[key];
        }
      }
    }
    return dest;
  }


  function _closestItem(startEl) {
    let testEl = startEl.previousElementSibling;
    while(testEl && (testEl === moveEl || testEl === dropzoneEl)) {
      testEl = testEl.previousElementSibling;
    }
    return testEl;
  }


  Draggr.create = function(el, options) {
    return new Draggr(el, options);
  };


  // Export
  Draggr.version = '1.0.0';
  return Draggr;

}); // draggrFactory















