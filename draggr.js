
console.log("FOUND draggr.js");

// for now just load these. We'll build the constructor later.


// WRAP LATER
var moveEl;
var ghostEl;

function dragStart(e) { // el.target is the source node!
  moveEl = e.target;
  e.target.style.opacity = '0.4';
  this.style.border = "1px solid #f0f";

  makeGhost(e.target);

  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text', 'ungabunga'); // not used but need it make drag work in FF.
}

function dragOver(e) {
  //let parentNode = e.target.parentNode;
  if(e.preventDefault) {
    e.preventDefault(); // Necessary. Allows us to drop!
  }
  let item = e.target.closest('.draggr-item');
  if(item) {
    item.style.border = "2px dashed #00f";
    // move teh ghost?
    item.parentNode.insertBefore(ghostEl, item.nextSibling);
  }

  e.dataTransfer.dropEffect = 'move'; // hmm....

}

function dragLeave(e) {
  console.log("dragLeave!");
  if(e.target.parentNode.className === 'draggr'){
    e.target.style.border = "";
  }
}

function dragEnd(e) {
  console.log("dragEnd!");
  this.style.border = "";
  moveEl.style.opacity = "";
  [].forEach.call(this.children, function(item) {
    if(item.className === 'draggr-ghost') {
      let parent = item.parentElement;
      parent.removeChild(item);
    }
  });
}

function dragDrop(e) {
  console.log("dragDrop!");

  if(e.preventDefault) {
    e.preventDefault(); // Necessary. Prevents redirect of doom!
  }
  if(e.target == moveEl)
    return;
  if(e.target.className === 'draggr-ghost')
    console.log("dropped on teh ghost!");
  return;
}

// creates a ghost object AFTER el in el's parent.
function makeGhost(el) {
  ghostEl = document.createElement("DIV");
  ghostEl.className = "draggr-ghost";

  // parent.insertBefore(newItem, el);
  el.parentNode.insertBefore(ghostEl, el.nextSibling);
}


function removeGhost(el) {
  el.parentNode.removeChild(el);
}


// find all of the draggr lists. Note, we're calling this on the parent
// not the individual items (yet?!)
var draggers = document.querySelectorAll('.draggr');
[].forEach.call(draggers, function(item) {
  item.addEventListener('dragstart', dragStart, false);
  item.addEventListener('dragover', dragOver, false);
  item.addEventListener('dragleave', dragLeave, false);
  item.addEventListener('dragend', dragEnd, false);
  item.addEventListener('drop', dragDrop, false);
})
