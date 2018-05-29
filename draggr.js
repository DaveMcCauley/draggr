
console.log("FOUND draggr.js");

// for now just load these. We'll build the constructor later.


// WRAP LATER
var moveEl;
var ghostEl;
var dragOffsetX;
var dropItem;
var dropChild;


function dragStart(e) { // el.target is the source node!
  dropChild = false;
  moveEl = e.target;
  e.target.style.opacity = '0.4';
  this.style.border = "1px solid #f0f";

  var offsetLeft = e.target.offsetLeft;
  dragOffsetX = e.offsetX;

  makeGhost(e.target);

  e.dataTransfer.effectAllowed = 'move';
  //e.dataTransfer.setData('text', 'ungabunga'); // not used but need it make drag work in FF.
  e.dataTransfer.setData('text/html', moveEl.innerHTML);
}

function dragOver(e) {
  //let parentNode = e.target.parentNode;
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
      console.log("bumpus");
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

  if(e.target === ghostEl) {
    console.log("dropping on ghostEl...")
    if(dropChild) {
      console.log("dropping into child...");
      let prevEl = ghostEl.previousSibling;
      let childs = prevEl.querySelector(".draggr .children");
      console.log("childs", childs);
      if (childs) {
        childs.appendChild(moveEl);
      }
    }
    else {
      console.log("move after prevsiousSibling...");
      if(ghostEl) {
        ghostEl.parentNode.insertBefore(moveEl, ghostEl);
      }
    }
  }

  console.log("e.target...", e.target);

  // clean up
  // if(e.target.className === 'draggr-ghost')
  //   console.log("dropped on teh ghost!");
  // return;
}

// creates a ghost object AFTER el in el's parent.
function makeGhost(el) {
  ghostEl = document.createElement("DIV");
  ghostEl.className = "draggr-ghost";

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
