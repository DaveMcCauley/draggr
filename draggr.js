
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
    },

    dragStart: function(e) { // el.target is the source node!
      dropChild = false;
      moveEl = e.target;
      this.style.border = "1px solid #f0f";

      rootEl = parentEl = e.target.parentElement;

      dragOffsetX = e.target.offsetLeft;

      //makeGhost(e.target);
      ghostEl = document.createElement("DIV");
      ghostEl.className = "draggr-ghost";
      rootEl.insertBefore(ghostEl, moveEl.nextElementSibling);

      e.dataTransfer.effectAllowed = 'move';
      //e.dataTransfer.setData('text', 'ungabunga'); // not used but need it make drag work in FF.
      e.dataTransfer.setData('text/html', moveEl.innerHTML);
    },



    dragOver: function(e) {
      if(e.preventDefault) {
        e.preventDefault(); // Necessary. Allows us to drop!
      }
      e.dataTransfer.dropEffect = 'move'; // hmm....

      // find the nearest (up) draggr-item, since innerHTML can fire
      // the on drag over event... find the nearest draggr-item and
      // move the ghostEl under it.
      // TODO: could I use bubbling instead and test for className?
      let item = e.target.closest('.draggr-item');
      if(item && (e.target.parentNode === item.parentNode)) {
        item.parentNode.insertBefore(ghostEl, item.nextSibling);
      }

      // above let's us switch parents with no restriction. But...
      // if we switched parents,
      if(item && (item.parentNode !== parentEl)) {
        console.log("change parents!");
        // don't need this, we only have ONE (closure scope) ghost now.
        // if(this.theParent) {
        //   [].forEach.call(this.theParent.children, function(item) {
        //     if(item.className === 'draggr-ghost') {
        //       this.theParent.removeChild(item);
        //     }
        //   })
        // }

        // update the current parent. (may need this later)
        parentEl = item.parentNode;
      }


      // bump if we are on the ghost element and X > 50px offset from the side
      // we're going to be inserting the moveEl as a child of the preceding
      // element when (if?) we drop it.
      if(e.target === ghostEl) {
        // let prevEl = ghostEl.previousSibling;
        // let leftSide = prevEl.offsetLeft;
        if(e.offsetX > dragOffsetX + 50) {
          ghostEl.style.marginLeft = "50px";
          dropChild = true;
        }
        else if(e.offsetX > dragOffsetX) { //debounces the shift.
          return;
        }
        else {
          ghostEl.style.marginLeft = "";
          dropChild = false;
        }

      }
    },

    dragLeave: function(e) {
      if(e.target.parentNode.className === 'draggr') {
        e.target.style.border = "";
      }

      if(e.target.className === 'draggr') {
        console.log("Leaving draggr...");
        //let parentEl = e.target.parentElement;
        // if(parenetEl.className) test for draggr?
        // TODO: Function this...
        [].forEach.call(e.target.children, function(item) {
          if(item.className === 'draggr-ghost') {
            e.target.removeChild(item);
          }
        });
      }

    },

    dragEnd: function(e) {

      this.style.border = "";
      this.moveEl.style.opacity = "";

      let parentEl = e.target.parentElement;
      // if(parenetEl.className) test for draggr?
      // TODO: Function this...
      [].forEach.call(parentEl.children, function(item) {
        if(item.className === 'draggr-ghost') {
          parentEl.removeChild(item);
        }
      });

      // does dragEnd bubble up?
      console.log("dragEnd.e.target.className", e.target.className);



    },

    dragDrop: function(e) {
      console.log("dragDrop!");

      if(e.preventDefault) {
        e.preventDefault(); // Necessary. Prevents redirect of doom!
      }

      if(e.target == this.moveEl)
        return;

      if(e.target === this.ghostEl) {
        if(this.dropChild) {
          let prevEl = this.ghostEl.previousSibling;
          let childs = prevEl.querySelector(".draggr .children");
          if (childs) {
            childs.appendChild(this.moveEl);
          }
        }
        else {
          if(this.ghostEl) {
            this.ghostEl.parentNode.insertBefore(this.moveEl, this.ghostEl);
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
    }


  // find all of the draggr lists. Note, we're calling this on the parent
  // not the individual items (yet?!)
  /*
  var draggers = document.querySelectorAll('.draggr');
  [].forEach.call(draggers, function(item) {
    item.addEventListener('dragstart', dragStart, false);
    item.addEventListener('dragover', dragOver, false);
    item.addEventListener('dragleave', dragLeave, false);
    item.addEventListener('dragend', dragEnd, false);
    item.addEventListener('drop', dragDrop, false);
  })
  */
  }


  Draggr.create = function(el) {
    return new Draggr(el);
  };

  // Export
  Draggr.version = '1.0.0';
  return Draggr;

}); // draggrFactory
