
console.log("LOADED draggr.js");

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
    // deprecate: nextEl,
    moveEl,
    // deprecate: dragOffsetX,
    dragStartX,
    dragStartY,
    // deprecate dropItem, // TODO: Used?
    dropChild,
    oldIndex, // TOOD:
    // deprecate, use dragStart  tapStart,
    // deprecate, never used it. touchTarget,
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
    //this.options = options = _extend({}, options);

    // Export instance
    el[expando] = this;

    // TODO: Implement defaults and config options.
    var defaults = {
      ghostClass: 'draggr-ghost',
      childShift: '50px'
    }

    // Bind all private methods
    // for (var fn in this) {
    //   if (fn.charAt(0) === 'u' && typeof this[fn] === 'function') {
    //     this[fn] = this[fn].bind(this);
    //   }
    // }
    this.onDragStart = this.onDragStart.bind(this);
    this.onDragOver = this.onDragOver.bind(this);
    this.onDragLeave = this.onDragLeave.bind(this);
    this.onDragEnd = this.onDragEnd.bind(this);
    this.onDrop = this.onDrop.bind(this);
    this.onTouchStart = this.onTouchStart.bind(this);
    this.onTouchMove = this.onTouchMove.bind(this);
    this.onTouchEnd = this.onTouchEnd.bind(this);
    this.onTouchCancel = this.onTouchCancel.bind(this);
    this.emulateDrag = this.emulateDrag.bind(this);

    // TODO: REMOVE IT"S JUST FOR DEBUGGING
    this.onDispatch = this.onDispatch.bind(this);

    // TODO: Consider binding only on tap/drag start?
    // bind the events to el
    this.bindEvents(el);

  }


  Draggr.prototype = {
    constructor: Draggr,

    bindEvents: function(el) {
      el.addEventListener('dragstart', this.onDragStart, false);
      el.addEventListener('dragover', this.onDragOver, false);
      el.addEventListener('dragleave', this.onDragLeave, false);
      el.addEventListener('dragend', this.onDragEnd, false);
      el.addEventListener('drop', this.onDrop, false);

      el.addEventListener('touchstart', this.onTouchStart, true);
      el.addEventListener('touchmove', this.onTouchMove, true);
      el.addEventListener('touchend', this.onTouchEnd, true);
      el.addEventListener('touchcancel', this.onTouchCancel, true);

      // TODO: REMOVE IT'S JUST FOR DEBUGGING....
      el.addEventListener('choose', this.onDispatch, true);
      el.addEventListener('add', this.onDispatch, true);
      el.addEventListener('remove', this.onDispatch, true);
      el.addEventListener('sort', this.onDispatch, true);
      el.addEventListener('update', this.onDispatch, true);
      el.addEventListener('end', this.onDispatch, true);
      el.addEventListener('move', this.onDispatch, true);
    },

    // TODO: REMOVE IT's FOR DEBUGGING....
    onDispatch: function(evt) {
      console.log("onDispatch:", evt.type, " ", evt);
    },

    dragTouchStart: function (evt, touch) {
      dropChild = false;
      moveEl = evt.target;
      rootEl = parentEl = evt.target.parentElement;

      oldIndex = this.index(evt.target);
      console.log("oldIndex: ", oldIndex);

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
        // // document.body.appendChild(ghostEl);
        // TODO: apply classes
        ghostEl.style.top = rect.top + 'px';
        ghostEl.style.left = rect.left + 'px';
        ghostEl.style.width = rect.width + 'px';
        ghostEl.style.height = rect.height + 'px';
        ghostEl.style.opacity = '.5';
        ghostEl.style.position = 'fixed';
        ghostEl.style.pointerEvents = 'none';
        ghostEl.style.border = "3px solid orange";
      }

      if(!dropzoneEl) {
        let rect = moveEl.getBoundingClientRect();
        dropzoneEl = evt.target.cloneNode(true);
        // TODO: apply class
        dropzoneEl.style.border = "2px solid green";
        dropzoneEl.style.opacity = 0.5;
        rootEl.insertBefore(dropzoneEl, moveEl.nextElementSibling);
      }

      this.dispatchEvent(this, rootEl, 'choose', moveEl, rootEl, rootEl, oldIndex)

      // This is tricky. If we set the opacity to 0, dragEnd will get
      // called. If we don't handle it, we will get two drag images
      // (native + our ghost). But if we set it to reallllly light,
      // the native interface gets called on the super light image, so
      // that hides (for all practical purpose) the native drag image.
      // We set the other visibility properties in the drag handler to
      // avoid having dragEnd called as the position and other properties
      // update.

      moveEl.style.opacity = '0.01';

      if(touch) {
        moveEl.style.visibility = 'hidden';
        moveEl.style.position = 'absolute';
        moveEl.style.zIndex = '-9999';
      }

    },



    onDragStart: function(evt) {
      this.dragTouchStart(evt);
      evt.dataTransfer.effectAllowed = 'move';
      evt.dataTransfer.setData('text/html', 'moveEl.innerHTML');
    },



    onTouchStart: function(evt) {
      evt.preventDefault();
      this.dragTouchStart(evt, true);
      // TODO: provide option for interval
      loopId = setInterval(this.emulateDrag, 50);
    },



    dragTouchDrag: function(target, currentX, currentY) {

      if(!target) return;

      // update moveEl HERE, so it doesn't trigger dragEnd
      // when we update properties. Could wrap this in a
      // conditional?
      moveEl.style.visibility = 'hidden';
      moveEl.style.position = 'absolute';
      moveEl.style.zIndex = '-9999';

      // move the ghost
      let dx = currentX - dragStartX;
      let dy = currentY - dragStartY;
      ghostEl.style.transform = "translate(" + dx + "px, " + dy + "px)";
      lastX = currentX;
      lastY = currentY;

      // move the dropzone
      let prevEl = target.closest('.draggr-item');
      // they have to share the same parent, otherwise they could be parent/child
      if(prevEl && (target.parentNode === prevEl.parentNode)) {
        var rect = prevEl.getBoundingClientRect();
        // try it with half/half
        var next = (currentY - rect.top)/(rect.bottom - rect.top) > .5;
        if(!dropzoneEl.contains(prevEl.parentNode)) {
          prevEl.parentNode.insertBefore(dropzoneEl, next && prevEl.nextSibling || !next && prevEl || null);
        }
      }

      // let's us switch parents with no restriction. But...
      // if we switched parents, update the parentEl property.
      if(prevEl && (prevEl.parentNode !== parentEl)) {
        // update the container style. TODO: use class?
        parentEl.style.border = "";
        // update the current parent property. (may need this later)
        parentEl = prevEl.parentNode;
        parentEl.style.border = "1px solid #f0f";
      }

      // bump if we are on the dropzone element and X > 50px offset from the side
      // we're going to be inserting the moveEl as a child of the preceding
      // element when (if?) we drop it.
      if(target === dropzoneEl) {
        // don't add child if at the top of the list!
        if((currentX > dragStartX + 50) && dropzoneEl.previousElementSibling) {
          dropzoneEl.style.marginLeft = "50px";
          dropChild = true;
        }
        else if((currentX > dragStartX) && dropzoneEl.previousElementSibling) { //debounces the shift.
          // TODO: this may be where my laggy problem lies...
          return;
        }
        else {
          dropzoneEl.style.marginLeft = "";
          dropChild = false;
        }
        // TODO: if 50px to left... bump to parent?
      }
    },



    onDragOver: function(evt) {
      evt.preventDefault();
      if(!moveEl || !ghostEl) // something dragged from outside!
        return;
      // TODO: test for new point?
      ghostEl.style.display = 'none';
      let target = document.elementFromPoint(evt.clientX, evt.clientY);
      this.dragTouchDrag(target, evt.clientX, evt.clientY);
      ghostEl.style.display = '';
    },


    onTouchMove: function(evt) {
      evt.preventDefault();
      touchEvt = evt.touches ? evt.touches[0] : evt;
    },


    emulateDrag: function(evt) {
      if(touchEvt) {
        if(this.lastX === touchEvt.clientX && this.lastY === touchEvt.clientY) {
          return;
        }

        ghostEl.style.display = 'none';
        let target = document.elementFromPoint(touchEvt.clientX, touchEvt.clientY);
        this.dragTouchDrag(target, touchEvt.clientX, touchEvt.clientY);
        ghostEl.style.display = '';

      }
    },


    dragTouchDrop: function(target, evt) {

      if(target === dropzoneEl) {
        if(dropChild) {
          // let prevEl = dropzoneEl.previousSibling;  // needs to be 'closest'
          let prevEl = dropzoneEl.previousElementSibling;
          // can't make it a child of itself and it needs a predecessor!
          if(!(prevEl === moveEl) && (prevEl.className === 'draggr-item')) {
            let childs = prevEl.querySelector(".draggr .children");
            if (childs) {
              // TODO: don't add if childs already contains the moveEl
              childs.appendChild(moveEl);
              // call teh move event handler
              let moveRect = moveEl.getBoundingClientRect();
              let targetRect = target.getBoundingClientRect();
              this.onMove(rootEl, this.el, moveEl, moveRect, target, targetRect, evt);
            }
          }
        }
        else {
          if(dropzoneEl) {
            dropzoneEl.parentNode.insertBefore(moveEl, dropzoneEl);
            let moveRect = moveEl.getBoundingClientRect();
            let targetRect = target.getBoundingClientRect();
            this.onMove(rootEl, this.el, moveEl, moveRect, target, targetRect, evt);
          }
        }

        if(rootEl !== parentEl) {
          newIndex = this.index(moveEl);
          console.log("newIndex: ", newIndex);
          this.dispatchEvent(this, rootEl, 'add', moveEl, parentEl, rootEl, oldIndex, newIndex); // dont' think I need the original event?
          this.dispatchEvent(this, rootEl, 'remove', moveEl, parentEl, rootEl, oldIndex, newIndex);
          this.dispatchEvent(this, parentEl, 'sort', moveEl, parentEl, rootEl, oldIndex, newIndex);
          this.dispatchEvent(this, rootEl, 'sort', moveEl, parentEl, rootEl, oldIndex, newIndex);
        }
        else {
          newIndex = this.index(moveEl);
          this.dispatchEvent(this, rootEl, 'update', moveEl, parentEl, rootEl, oldIndex, newIndex);
          this.dispatchEvent(this, rootEl, 'sort', moveEl, parentEl, rootEl, oldIndex, newIndex);
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
      }

      this.dispatchEvent(this, rootEl, 'end', moveEl, parentEl, rootEl, oldIndex, newIndex);

    },



    onDrop: function(evt) {
      evt.preventDefault(); // Necessary. Prevents redirect of doom!

      if(!moveEl || !ghostEl) // something dragged from outside!
        return;

      // TODO: test for new point?
      ghostEl.style.display = 'none';
      let target = document.elementFromPoint(evt.clientX, evt.clientY);
      this.dragTouchDrop(target, evt);
      this.nullify();
    },



    onTouchEnd: function(evt) {
      evt.preventDefault();
      // stop the emulated drag!
      clearInterval(loopId);
      if(ghostEl) ghostEl.style.display = 'none';
      let target = document.elementFromPoint(evt.changedTouches[0].clientX, evt.changedTouches[0].clientY);
      this.dragTouchDrop(target, evt);
      this.nullify();
    },



    onDragLeave: function(evt) {
      //console.log("onDragLeave:", evt);
      /*if(evt.target.className === 'draggr' && dropzoneEl && dropzoneEl.parentElement) {
        dropzoneEl.parentElement.removeChild(dropzoneEl);
      }*/
    },



    onDragEnd: function(evt) {

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
      }

      this.nullify();

    },



    onTouchCancel: function(evt) {
      evt.preventDefault();
      console.log("touchCancel: called");
    },



    nullify: function() {
      moveEl = null;
      dropzoneEl = null;
      ghostEl = null;
      dragStartX = dragStartY = null;
      touchEvt = null;
      loopId = null;
      lastX = null;
      lastY = null;
    },


    index: function(el) {
      let i = 0;

      if(!el || !el.parentNode) {
        return -1;
      }

      while(el && (el = el.previousElementSibling)) {
        if(this.matches(el, '.draggr-item')) {
          i++;
        }
      }

      return i;
    },

    matches: function (el, selector) {
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
    },



    dispatchEvent: function(draggr, rootEl, name, targetEl, toEl, fromEl, startIndex, newIndex, originalEvt) {
      let evt = document.createEvent('Event'),
          options = draggr.options,
          onName = 'on' + name.charAt(0).toUpperCase() + name.substr(1);

      evt.initEvent(name, true, true);

      evt.to = toEl || rootEl;
      evt.from = fromEl || rootEl;
      evt.item = targetEl || rootEl;
      evt.clone = null; // don't support cloning, but keep for API compatability.
      evt.oldIndex = oldIndex;
      evt.newIndex = newIndex;
      evt.originalEvent = originalEvt;

      rootEl.dispatchEvent(evt);

      if(options[onName]) {
        options[onName].call(draggr, evt);
      }
    },



    onMove: function(fromEl, toEl, dragEl, dragRect, targetEl, targetRect, originalEvt, willInsertAfter) {
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

  }, // END OF PROTOTYPE

  Draggr._extend = function(dest, src) {
    if (dist && src) {
      for (var key in src) {
        if (src.hasOwnProperty(key)) {
          dest[key] = src[key];
        }
      }
    }
    return dest;
  };

  Draggr.create = function(el) {
    return new Draggr(el);
  };

  // Export
  Draggr.version = '1.0.0';
  return Draggr;

}); // draggrFactory















