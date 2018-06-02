
console.log("FOUND draggr.js");


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

  var dragEl,
    parentEl,
    ghostEl,
    rootEl,
    nextEl,
    moveEl,
    dragOffsetX,
    dropItem, // TODO: Used?
    dropChild,
    oldIndex, // TOOD:
    tapStart,
    touchTarget,
    newIndex;  // TODO:


  // closureUngabunga = 2;
  // somethingElse = "Unicorn";

  // this is the Draggr constructor!
  function Draggr(el, options) {
    if(!(el && el.nodeType && el.nodeType === 1)) {
      throw 'Draggr: \'el\' must be an HTMLElement, and not ' + {}.toString.call(el);
    }

    var defaults = {
      ghostClass: 'draggr-ghost',
      childShift: '50px'
    }

    // roll up defaults
  //   for(var name in defaults) {
  //     !(name in options) && (options[name] = defaults[name]);
  //   }

    // Bind all private methods
    // for (var fn in this) {
    //   if (fn.charAt(0) === 'u' && typeof this[fn] === 'function') {
    //     this[fn] = this[fn].bind(this);
    //   }
    // }
    this.touchMove = this.touchMove.bind(this);
    this.moveGhost = this.moveGhost.bind(this);

    // bind the events to el
    this.bindEvents(el);

  }


  Draggr.prototype = {
    constructor: Draggr,

    bindEvents: function(el) {
      el.addEventListener('dragstart', this.dragStart, false);
      el.addEventListener('dragover', this.dragOver, false);
      el.addEventListener('dragleave', this.dragLeave, false);
      el.addEventListener('dragend', this.dragEnd, false);
      el.addEventListener('drop', this.dragDrop, false);

      el.addEventListener('touchstart', this.touchStart, true);
      el.addEventListener('touchmove', this.touchMove, true);
      el.addEventListener('touchend', this.touchEnd, true);

    },

    dragStart: function(e) {
      dropChild = false;
      // TODO: Only pickup e.target if it's a draggr-item
      moveEl = e.target;
      rootEl = parentEl = e.target.parentElement;
      // TODO: Remove
      rootEl.style.border = "1px solid #f0f";
      dragOffsetX = e.offsetX;

      if(!ghostEl) {
        ghostEl = document.createElement("DIV");
        ghostEl.className = "draggr-ghost";
        rootEl.insertBefore(ghostEl, moveEl.nextElementSibling);
      }

      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/html', moveEl.innerHTML);
    },



    dragOver: function(e) {

      //e.stopPropagation();
      if(e.preventDefault) {
        e.preventDefault(); // Necessary. Allows us to drop!
      }
      e.dataTransfer.dropEffect = 'move'; // hmm....
////////////////////////
      // find the nearest (up) draggr-item, since innerHTML can fire
      // the on drag over event... find the nearest draggr-item and
      // move the ghostEl under it.
      // TODO: could I use bubbling instead and test for className?

      let prevEl = e.target.closest('.draggr-item');
      // they have to share the same parent, otherwise they could be parent/child
      if(prevEl && (e.target.parentNode === prevEl.parentNode)) {
        var rect = prevEl.getBoundingClientRect();
        // try it with half/half
        var next = (e.clientY - rect.top)/(rect.bottom - rect.top) > .5;
        prevEl.parentNode.insertBefore(ghostEl, next && prevEl.nextSibling || !next && prevEl || null);
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

      // bump if we are on the ghost element and X > 50px offset from the side
      // we're going to be inserting the moveEl as a child of the preceding
      // element when (if?) we drop it.
      if(e.target === ghostEl) {
        // don't add child if at the top of the list!
        if((e.offsetX > dragOffsetX + 50) && ghostEl.previousElementSibling) {
          ghostEl.style.marginLeft = "50px";
          dropChild = true;
        }
        else if((e.offsetX > dragOffsetX) && ghostEl.previousElementSibling) { //debounces the shift.
          return;
        }
        else {
          ghostEl.style.marginLeft = "";
          dropChild = false;
        }
      }
//////////////
    },

    dragLeave: function(e) {

      // TODO: do we need this indicator?
      if(e.target.parentNode.className === 'draggr') {
        e.target.style.border = "";
      }

      // if we're leaving a draggr parent, we no longer
      // need to show the ghost, because dropping it
      // will not result in an insertion
      // TODO: This doesn't work all that well. I can easly move
      // the drag fast and it doesn't fire the event fast enough.
      if(e.target.className === 'draggr' && ghostEl && ghostEl.parentElement) {
        ghostEl.parentElement.removeChild(ghostEl);
      }

    },

    dragEnd: function(e) {

      this.style.border = "";
      moveEl.style.opacity = "";

      // remove the ghosts from the parent, we dont' need it anymore.
      if(ghostEl && ghostEl.parentElement) {
        ghostEl.parentElement.removeChild(ghostEl);
        //ghostEl = null;
      }

    },

    dragDrop: function(e) {

      if(e.preventDefault) {
        e.preventDefault(); // Necessary. Prevents redirect of doom!
      }

      if(e.target === moveEl)
        return; // TODO: consider adding as child? sibling?

      if(e.target === ghostEl) {
        if(dropChild) {
          let prevEl = ghostEl.previousSibling;
          // can't make it a child of itself and it needs a predecessor!
          if(!(prevEl === moveEl) && (prevEl.className === 'draggr-item')) {
            let childs = prevEl.querySelector(".draggr .children");
            if (childs) {
              // TODO: don't add if childs already contains the moveEl
              childs.appendChild(moveEl);
            }
          }
        }
        else {
          if(ghostEl) {
            ghostEl.parentNode.insertBefore(moveEl, ghostEl);
          }
        }
      }

    },

    // creates a ghost object AFTER el in el's parent.
    makeGhost: function(el) {
      this.ghostEl = document.createElement("DIV");
      this.ghostEl.className = "draggr-ghost";
      el.parentNode.insertBefore(this.ghostEl, el.nextSibling);
    },

    removeGhost: function(el) {
      el.parentNode.removeChild(el);
    },

    removeChildrenByClass: function(el, classname) {// TODO: Function this...
      [].forEach.call(el.children, function(item) {
        if(item.className === classname) {
          el.removeChild(item);
        }
      });
    },


    touchStart: function(evt) {
      evt.preventDefault();
      console.log("touchStart:", evt);
      evt.target.style.border = "1px solid #333";
      // TODO: should probably do some validaion for >1 touches?
      tapStart = evt.touches[0];

////////////
      dropChild = false;
      // TODO: Only pickup e.target if it's a draggr-item
      moveEl = evt.target;
      rootEl = parentEl = evt.target.parentElement;
      // TODO: Remove
      rootEl.style.border = "1px solid #f0f";
      ///>>>>  dragOffsetX = e.offsetX;

      if(!ghostEl) {
        ghostEl = document.createElement("DIV");
        ghostEl.className = "draggr-ghost";
        rootEl.insertBefore(ghostEl, moveEl.nextElementSibling);
      }

    },


    touchMove: function(evt) {

      let target = document.elementFromPoint(evt.touches[0].clientX, evt.touches[0].clientY);
      //console.log("target", target);
      if(target && target.className === 'draggr-item') {
        if(touchTarget !== target) {
          if(touchTarget) {touchTarget.style.border = "";}
          target.style.border = "3px solid #0f0";
          touchTarget = target;
        }
      }
      this.moveGhost(target, evt.touches[0].clientX, evt.touches[0].clientY);
    },


    moveGhost: function (target, clientX, clientY) {
      if(!target) return;
      console.log("I'm the great ungabugna!");
            // find the nearest (up) draggr-item, since innerHTML can fire
      // the on drag over event... find the nearest draggr-item and
      // move the ghostEl under it.
      // TODO: could I use bubbling instead and test for className?

      let prevEl = target.closest('.draggr-item');
      // they have to share the same parent, otherwise they could be parent/child
      if(prevEl && (target.parentNode === prevEl.parentNode)) {
        var rect = prevEl.getBoundingClientRect();
        // try it with half/half
        var next = (clientY - rect.top)/(rect.bottom - rect.top) > .5;
        prevEl.parentNode.insertBefore(ghostEl, next && prevEl.nextSibling || !next && prevEl || null);
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

      // bump if we are on the ghost element and X > 50px offset from the side
      // we're going to be inserting the moveEl as a child of the preceding
      // element when (if?) we drop it.
      if(target === ghostEl) {
        // don't add child if at the top of the list!
        if((clientX > tapStart.clientX + 50) && ghostEl.previousElementSibling) {
          ghostEl.style.marginLeft = "50px";
          dropChild = true;
        }
        else if((clientX > tapStart.clientX) && ghostEl.previousElementSibling) { //debounces the shift.
          // TODO: this may be where my laggy problem lies...
          return;
        }
        else {
          ghostEl.style.marginLeft = "";
          dropChild = false;
        }
      }
    },


    touchEnd: function(evt) {

      if(evt.preventDefault) {
        evt.preventDefault(); // Necessary. Prevents redirect of doom!
      }
      console.log("touchEnd:");
      console.log("  evt.target:", evt.target);
      let target = document.elementFromPoint(evt.changedTouches[0].clientX, evt.changedTouches[0].clientY);
      console.log("  touchEnd:", target);
      if(target === moveEl)
        return; // TODO: consider adding as child? sibling?

      if(target === ghostEl) {
        if(dropChild) {
          let prevEl = ghostEl.previousSibling;
          // can't make it a child of itself and it needs a predecessor!
          if(!(prevEl === moveEl) && (prevEl.className === 'draggr-item')) {
            let childs = prevEl.querySelector(".draggr .children");
            if (childs) {
              // TODO: don't add if childs already contains the moveEl
              childs.appendChild(moveEl);
            }
          }
        }
        else {
          if(ghostEl) {
            ghostEl.parentNode.insertBefore(moveEl, ghostEl);
          }
        }
      }

      ///> clean up. See also dragEnd.
      evt.target.style.border = "";
      moveEl.style.opacity = "";

      // remove the ghosts from the parent, we dont' need it anymore.
      if(ghostEl && ghostEl.parentElement) {
        ghostEl.parentElement.removeChild(ghostEl);
      }

    }

  }


  Draggr.create = function(el) {
    return new Draggr(el);
  };

  // Export
  Draggr.version = '1.0.0';
  return Draggr;

}); // draggrFactory


// var clickEvent = (function() {
//   if ('ontouchstart' in document.documentElement === true)
//     return 'touchstart';
//   else
//     return 'click';
// })();