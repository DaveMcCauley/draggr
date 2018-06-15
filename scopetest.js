
// So helpful...
// https://gomakethings.com/the-anatomy-of-a-vanilla-javascript-plugin/

(function ScoperModule(factory) {
  "use strict";
  if(typeof define === "function" && define.amd) {
    define(factory);
  }
  else if(typeof module != "undefined" && typeof module.exports != "undefined") {
    // export it using ES module
    module.exports = factory();
  }
  else {
    window["Scoper"] = factory();
  }
})(function scoperFactory() {
  "use strict";

  // make sure it's a window wiff a document.
  if(typeof window === "undefined" || !window.document) {
    return function scoperError() {
      throw new Error("Scopetest.js requires a window with a document");
    };
  }

  // These are closure scoped variables.
  var closureVar,
      anotherClosureVar,
      closureFxn = function() { return true; };

  // @class Scoper
  function Scoper(options) {
    this.extenionRes = _extend({}, options);
    this.options = options;
  } // end Scoper class def

  //@lends Scoper.prototype
  Scoper.prototype = {
    constructor: Scoper,
    prototypeFxn: function() {
      console.log("prototypeFxn:");
      return true;
    },
    destroy: function() {
      console.log("destroy:");
      return true;;
    },
    whoami: function() {
      console.log("Scoper.prototype.whoami: ");
      console.log("  name: ", this.options.name);
      console.log("  closureVar: ", closureVar);
    },
    setClosureVar: function(val) {
      console.log("Scoper.prototype.setClosureVar: ");
      let ret = _extend(val);
      console.log('  ret:', ret);
      closureVar = val;
    },
    genericHandler(evt) {
      console.log("Scoper.prototype.genericHandler:", evt);
      console.log("  _extend:", _extend());
      this.setClosureVar('IngaBinga');
      expando();
      console.log("  closureVar:", closureVar);
      return true;
    }

  } // end Scoper.prototype

  function _extend(obj,src) {
    console.log('_extend:');
    return true;
  }

  function expando() {
    closureVar += ' expanded';
  }

  Scoper.create = function(options) {
    return new Scoper(options);
  }

  return Scoper;

}); //end of scoperFactory and self-invoking parameter