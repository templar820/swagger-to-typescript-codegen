import get from 'get-object';
import set from 'set-value';

export default class RequestTreeTag {
  tree:any;

  constructor() {
    this.tree = {};
  }

  isExist(path: string[]) {
    const objectPath = path.join('.');
    return !!get(this.tree, objectPath);
  }

  addElementInTree(path: string[], element: any) {
    const objectPath = path.join('.');
    set(this.tree, objectPath, element);
  }

  getElement(path: string[]) {
    const objectPath = path.join('.');
    return get(this.tree, objectPath);
  }

  deleteElementInTree(path) {

  }
}
