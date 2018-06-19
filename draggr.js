
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
    prevEl,
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
    this.options = options = _extend({}, options);

    // Export instance
    el[expando] = this;

    // TODO: Implement defaults and config options.
    var defaults = {
      ghostClass: 'draggr-ghost',
      dropzoneClass: 'draggr-dropzone',
      dragClass: 'draggr-drag',
      parentClass: 'draggr-parent',
      childClass: 'draggr-child',
      childShift: '50px'
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

    // DEPRECATE. Using binding as above.
    // this._onDragStart = this._onDragStart.bind(this);
    // this._onDragOver = this._onDragOver.bind(this);
    // this._onDragLeave = this._onDragLeave.bind(this);
    // this._onDragEnd = this._onDragEnd.bind(this);
    // this._onDrop = this._onDrop.bind(this);
    // this._onTouchStart = this._onTouchStart.bind(this);
    // this._onTouchMove = this._onTouchMove.bind(this);
    // this._onTouchEnd = this._onTouchEnd.bind(this);
    // this._onTouchCancel = this._onTouchCancel.bind(this);
    // this._emulateDrag = this._emulateDrag.bind(this);

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

    _dragTouchStart: function (evt, touch) {
      dropChild = false;
      moveEl = evt.target;
      prevEl = evt.target.previousElementSibling;
      _toggleClass(prevEl, 'draggr-prevEl', true);
      // for debug;

      rootEl = parentEl = evt.target.parentElement;

      oldIndex = this._index(evt.target);
      console.log("oldIndex: ", oldIndex);

      // TODO: Simplify
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
        //ghostEl.style.opacity = '.5';
        ghostEl.style.position = 'fixed';
        ghostEl.style.pointerEvents = 'none';
        //ghostEl.style.border = "3px solid orange";

        _toggleClass(ghostEl, this.options.ghostClass, true);
      }

      if(!dropzoneEl) {
        let rect = moveEl.getBoundingClientRect();
        dropzoneEl = evt.target.cloneNode(true);
        // TODO: apply class
        //dropzoneEl.style.border = "2px solid green";
        //dropzoneEl.style.opacity = 0.5;
        rootEl.insertBefore(dropzoneEl, moveEl.nextElementSibling);
        _toggleClass(dropzoneEl, this.options.dropzoneClass, true);
      }

      this._dispatchEvent(this, rootEl, 'choose', moveEl, rootEl, rootEl, oldIndex)

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
        // moveEl.style.visibility = 'hidden';
        moveEl.style.position = 'absolute';
        moveEl.style.zIndex = '-9999';
      //moveEl.style.display = 'none';
      }

            /// just sticking it here for the moment.
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

      // TODO: Combine with earl exit above?
      // could also use target.parent != '.draggr' or the like.
      // if(!target.classList.contains('draggr-item')) {
      //   return;
      // }

      // update moveEl HERE, so it doesn't trigger dragEnd
      // when we update properties. Could wrap this in a
      // conditional?
      // moveEl.style.visibility = 'hidden';
      // moveEl.style.position = 'absolute';
      // moveEl.style.zIndex = '-9999';
      if(!moveEl.style.display) {
        //parent2b = moveEl.previousElementSibling;
        moveEl.style.display = 'none';
        return;
      }

      // move the ghost
      let dx = currentX - dragStartX;
      let dy = currentY - dragStartY;
      ghostEl.style.transform = "translate(" + dx + "px, " + dy + "px)";
      lastX = currentX;
      lastY = currentY;

      // move the dropzone
      // dont' need this as I've killed off events on children.
      // this is always going to be the target!
      // let prevEl = target.closest('.draggr-item');

      // DEBUG TEST
      if(!target.classList.contains('draggr-item')){
        console.log("NOT AN ITEM!!!!!!!!!");
      }

      // super janky. But it's "working".
      // _toggleClass(parent2b, this.options.parentClass, false);
      // if(prevEl && prevEl.previousElementSibling && prevEl.previousElementSibling.classList.contains('moveEl')) {
      //   parent2b = prevEl.previousElementSibling.previousElementSibling;
      // }
      // else {
      //   parent2b = prevEl.previousElementSibling;
      // }

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
              console.log('moved dropzone down...');
              _toggleClass(oldEl, 'draggr-prevEl', false);
              _toggleClass(prevEl, 'draggr-prevEl', true);
            }
          }
          else if(!next && !dropzoneEl.contains(target.parentNode)) {
            target.parentNode.insertBefore(dropzoneEl, target || null);
            // prevEl = target.previousElementSibling;
            let oldEl = prevEl;
            prevEl = _closestItem(dropzoneEl);
            if(oldEl !== prevEl) {
              console.log('moved dropzoneEl up...');
              _toggleClass(oldEl, 'draggr-prevEl', false);
              _toggleClass(prevEl, 'draggr-prevEl', true);
            }

          }

          // if(!dropzoneEl.contains(target.parentNode)) {
          //   target.parentNode.insertBefore(dropzoneEl, next && target.nextSibling || !next && target || null);
          //               _toggleClass(prevEl, 'draggr-prevEl', false);
          //   prevEl = _closestItem(dragzoneEl);
          //   _toggleClass(prevEl, 'draggr-prevEl', true);

          // //if(next) {
          //   // update teh previous element after we move it.
          //   // for now, always update.
          //   // TODO: HACK. OPtimize this good grief.
          //   var oldPrevEl = prevEl;
          //   prevEl = _closestItem(dropzoneEl);
          //   if(oldPrevEl != prevEl) {
          //     _toggleClass(oldPrevEl, 'draggr-prevEl', false);
          //     _toggleClass(prevEl, 'draggr-prevEl', true);
          //   }
          // //}
        } else {
        // if we *are* over the dropzone, we just update the prevEl. And we need
        // to do this because the update doesn't gurantee it works w/frame rate, etc.
          let oldEl = prevEl;
          prevEl = _closestItem(dropzoneEl);
          if(oldEl !== prevEl) {
            console.log('on dropzone, don\'t move it, update prevEl...');
            console.log('oldEl:', oldEl);
            console.log('prevEl:', prevEl);
            _toggleClass(oldEl, 'draggr-prevEl', false);
            _toggleClass(prevEl, 'draggr-prevEl', true);
          }
        }

      }
      else {
        // we've switched parents.
        // update the parentEl.
        parentEl = target.parentNode;
        return;
      }

      // bump right if we are on the dropzone element and X > 50px offset from the side
      // we're going to be inserting the moveEl as a child of the preceding
      // element when (if?) we drop it.
      if(target === dropzoneEl) {
        // don't add child if at the top of the list!
        // TODO: Optimize to single query of dropzoneEl.previousElementStibling
        //       possibly with !!(prevs);
        if((currentX > dragStartX + 50) && dropzoneEl.previousElementSibling) {
          dropzoneEl.style.marginLeft = "50px";
          dropChild = true;
          //_toggleClass(parent2b, this.options.parentClass, true);
        }
        else if((currentX > dragStartX) && dropzoneEl.previousElementSibling) { //debounces the shift.
          // TODO: this may be where my laggy problem lies...
          return;
        }
        else {
          //_toggleClass(parent2b, this.options.parentClass, false);
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
              this._onMove(rootEl, this.el, moveEl, moveRect, target, targetRect, evt);
            }
          }
        }
        else {
          if(dropzoneEl) {
            dropzoneEl.parentNode.insertBefore(moveEl, dropzoneEl);
            let moveRect = moveEl.getBoundingClientRect();
            let targetRect = target.getBoundingClientRect();
            this._onMove(rootEl, this.el, moveEl, moveRect, target, targetRect, evt);
          }
        }

        if(rootEl !== parentEl) {
          newIndex = this._index(moveEl);
          console.log("newIndex: ", newIndex);
          this._dispatchEvent(this, rootEl, 'add', moveEl, parentEl, rootEl, oldIndex, newIndex); // dont' think I need the original event?
          this._dispatchEvent(this, rootEl, 'remove', moveEl, parentEl, rootEl, oldIndex, newIndex);
          this._dispatchEvent(this, parentEl, 'sort', moveEl, parentEl, rootEl, oldIndex, newIndex);
          this._dispatchEvent(this, rootEl, 'sort', moveEl, parentEl, rootEl, oldIndex, newIndex);
        }
        else {
          newIndex = this._index(moveEl);
          this._dispatchEvent(this, rootEl, 'update', moveEl, parentEl, rootEl, oldIndex, newIndex);
          this._dispatchEvent(this, rootEl, 'sort', moveEl, parentEl, rootEl, oldIndex, newIndex);
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

      this._dispatchEvent(this, rootEl, 'end', moveEl, parentEl, rootEl, oldIndex, newIndex);

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
      console.log("onDragLeave:", evt);
    },



    _onDragEnd: function(evt) {

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
      console.log("touchCancel: called");
    },



    _nullify: function() {
      moveEl = null;
      dropzoneEl = null;
      ghostEl = null;
      dragStartX = dragStartY = null;
      touchEvt = null;
      loopId = null;
      lastX = null;
      lastY = null;
    },

    // TODO : Move to closure scope.
    _index: function(el) {
      let i = 0;

      if(!el || !el.parentNode) {
        return -1;
      }

      while(el && (el = el.previousElementSibling)) {
        if(this._matches(el, '.draggr-item')) {
          i++;
        }
      }

      return i;
    },

    // TODO : Move to closure scope.
    _matches: function (el, selector) {
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


    // TODO : Move to closure scope.
    _dispatchEvent: function(draggr, rootEl, name, targetEl, toEl, fromEl, startIndex, newIndex, originalEvt) {
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


    // TODO : Move to closure scope.
    _onMove: function(fromEl, toEl, dragEl, dragRect, targetEl, targetRect, originalEvt, willInsertAfter) {
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

  } // END OF PROTOTYPE



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
    // RESUME NOTE: You have moveEl, and dragzoneEl available. Just cmompare them directly here.
    //              rather than using classes.
    while(testEl && (testEl === moveEl || testEl === dropzoneEl)) {
      testEl = testEl.previousElementSibling;
    }
    return testEl;
  }

  Draggr.create = function(el) {
    return new Draggr(el);
  };

  // Export
  Draggr.version = '1.0.0';
  return Draggr;

}); // draggrFactory















