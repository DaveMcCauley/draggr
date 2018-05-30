
console.log("FOUND draggr.js");

// this is the Draggr constructor!
function Draggr(el, options) {
  if(!(el && el.nodeType && el.nodeType === 1)) {
    throw 'Draggr: \'el\' must be an HTMLElement, and not ' + {}.toString.call(el);
  }

  var rootEl = el;
  // this.options = (lodash) extend ;

  var defaults = {
    ghostClass: 'draggr-ghost',
    childShift: '50px'
  }

  // roll up defaults
//   for(var name in defaults) {
//     !(name in options) && (options[name] = defaults[name]);
//   }

    // WRAP LATER
  var moveEl;
  var ghostEl;
  var dragOffsetX;
  var dropItem;
  var dropChild;

  // bind the events to el
  el.addEventListener('dragstart', this.dragStart, false);
  el.addEventListener('dragover', this.dragOver, false);
  el.addEventListener('dragleave', this.dragLeave, false);
  el.addEventListener('dragend', this.dragEnd, false);
  el.addEventListener('drop', this.dragDrop, false);

}


Draggr.prototype = {
  constructor: Draggr,

  // WRAP LATER
  // var moveEl;
  // var ghostEl;
  // var dragOffsetX;
  // var dropItem;
  // var dropChild;

  dragStart: function(e) { // el.target is the source node!
    dropChild = false;
    moveEl = e.target;
    this.style.border = "1px solid #f0f";

    var offsetLeft = e.target.offsetLeft;
    dragOffsetX = e.offsetX;

    //makeGhost(e.target);
    ghostEl = document.createElement("DIV");
    ghostEl.className = "draggr-ghost";
    rootEl.parentNode.insertBefore(ghostEl, rootEl.nextSibling);
////////////

    e.dataTransfer.effectAllowed = 'move';
    //e.dataTransfer.setData('text', 'ungabunga'); // not used but need it make drag work in FF.
    e.dataTransfer.setData('text/html', moveEl.innerHTML);
  },

  dragOver: function(e) {
    if(e.preventDefault) {
      e.preventDefault(); // Necessary. Allows us to drop!
    }

    let item = e.target.closest('.draggr-item');
    if(item) {
      item.style.border = "2px dashed #00f";
      item.parentNode.insertBefore(ghostEl, item.nextSibling);
    }

    // bump if we are on the ghost element and X > 50px offset from the side
    if(e.target === ghostEl) {
      // let prevEl = ghostEl.previousSibling;
      // let leftSide = prevEl.offsetLeft;
      if(e.offsetX > dragOffsetX + 50) {
        ghostEl.style.marginLeft = "50px";
        dropChild = true;
      }
      else if(e.offsetX > dragOffsetX) {
        return;
      }
      else {
        ghostEl.style.marginLeft = "";
        dropChild = false;
      }

    }

    e.dataTransfer.dropEffect = 'move'; // hmm....

  },

  dragLeave: function(e) {
    if(e.target.parentNode.className === 'draggr') {
      e.target.style.border = "";
    }
  },

  dragEnd: function(e) {
    this.style.border = "";
    moveEl.style.opacity = "";
    // TODO: Function this...
    [].forEach.call(this.children, function(item) {
      if(item.className === 'draggr-ghost') {
        let parent = item.parentElement;
        parent.removeChild(item);
      }
    });
  },

  dragDrop: function(e) {
    console.log("dragDrop!");

    if(e.preventDefault) {
      e.preventDefault(); // Necessary. Prevents redirect of doom!
    }

    if(e.target == moveEl)
      return;

    if(e.target === ghostEl) {
      if(dropChild) {
        let prevEl = ghostEl.previousSibling;
        let childs = prevEl.querySelector(".draggr .children");
        if (childs) {
          childs.appendChild(moveEl);
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
    ghostEl = document.createElement("DIV");
    ghostEl.className = "draggr-ghost";

    el.parentNode.insertBefore(ghostEl, el.nextSibling);

  },

  removeGhost: function(el) {
    el.parentNode.removeChild(el);
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
