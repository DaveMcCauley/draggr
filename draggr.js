
console.log("FOUND draggr.js");

// this is the Draggr constructor!
function Draggr(el, options) {
  if(!(el && el.nodeType && el.nodeType === 1)) {
    throw 'Draggr: \'el\' must be an HTMLElement, and not ' + {}.toString.call(el);
  }

  this.rootEl = el;
  // this.options = (lodash) extend ;.

  let ungabunga = 2;

  var defaults = {
    ghostClass: 'draggr-ghost',
    childShift: '50px'
  }

  // roll up defaults
//   for(var name in defaults) {
//     !(name in options) && (options[name] = defaults[name]);
//   }

    // WRAP LATER
  this.moveEl = {};
  this.ghostEl = {};
  this.dragOffsetX = {};
  this.dropItem = {};
  this.dropChild = {};
  this.startParent = {};
  this.theParent = {};

  // bind the events to el
  // el.addEventListener('dragstart', this.dragStart, false);
  // el.addEventListener('dragover', this.dragOver, false);
  // el.addEventListener('dragleave', this.dragLeave, false);
  // el.addEventListener('dragend', this.dragEnd, false);
  // el.addEventListener('drop', this.dragDrop, false);

}


Draggr.prototype = {
  constructor: Draggr,

  // WRAP LATER
  // var moveEl;
  // var ghostEl;
  // var dragOffsetX;
  // var dropItem;
  // var dropChild;

  bindEvents: function(el) {
    this.rootEl = el;
    this.rootEl.addEventListener('dragstart', this.dragStart, false);
    this.rootEl.addEventListener('dragover', this.dragOver, false);
    this.rootEl.addEventListener('dragleave', this.dragLeave, false);
    this.rootEl.addEventListener('dragend', this.dragEnd, false);
    this.rootEl.addEventListener('drop', this.dragDrop, false);
  },

  dragStart: function(e) { // el.target is the source node!
    this.dropChild = false;
    this.moveEl = e.target;
    this.style.border = "1px solid #f0f";

    this.theParent = this.starParent = e.target.parentElement;

    var offsetLeft = e.target.offsetLeft;
    dragOffsetX = e.offsetX;   //////////////////////

    //makeGhost(e.target);
    this.ghostEl = document.createElement("DIV");
    this.ghostEl.className = "draggr-ghost";
    //this.rootEl.parentNode.insertBefore(this.ghostEl, this.rootEl.nextSibling);
////////////

    e.dataTransfer.effectAllowed = 'move';
    //e.dataTransfer.setData('text', 'ungabunga'); // not used but need it make drag work in FF.
    e.dataTransfer.setData('text/html', this.moveEl.innerHTML);
  },



  dragOver: function(e) {
    if(e.preventDefault) {
      e.preventDefault(); // Necessary. Allows us to drop!
    }

    e.dataTransfer.dropEffect = 'move'; // hmm....
    let item = e.target.closest('.draggr-item');
    if(item && (e.target.parentNode === item.parentNode)) {
      //   item.style.border = "2px dashed #00f";
      item.parentNode.insertBefore(this.ghostEl, item.nextSibling);

    }

    // if switched parents, clean up ghosts in the parent just left.
    if(item && (item.parentNode !== this.theParent)) {
      console.log("change parents!");
      if(this.theParent) {
        [].forEach.call(this.theParent.children, function(item) {
          if(item.className === 'draggr-ghost') {
            this.theParent.removeChild(item);
          }
        })
      }
      this.theParent = item.parentNode;
    }


    // bump if we are on the ghost element and X > 50px offset from the side
    if(e.target === this.ghostEl) {
      // let prevEl = ghostEl.previousSibling;
      // let leftSide = prevEl.offsetLeft;
      if(e.offsetX > dragOffsetX + 50) {
        this.ghostEl.style.marginLeft = "50px";
        this.dropChild = true;
      }
      else if(e.offsetX > dragOffsetX) {
        return;
      }
      else {
        this.ghostEl.style.marginLeft = "";
        this.dropChild = false;
      }

    }

    ////////////////////////////////////////
    // Resume notes....
    // Somewhere in here need to clean out any ghosts when entering
    // a new draggr class....

    // ex. set a 'global' variable for parent.
    // when target.parent != global, clean up the global ghosts.

    // if (current parent != previous parent) set to new parent,
    // possibly store the original parent (for move event callback).







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
