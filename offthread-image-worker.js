'use strict';

class ImageHandler {

  constructor(workerContext) {
    this.queue = [];
    this.workerContext = workerContext;
  }

  enqueue(toEnqueue) {
    // Bail if this URL is already enqueued.
    if (this.queue.indexOf(toEnqueue) >= 0) {
      return;
    }

    this.queue.push(toEnqueue);
    this.resumeQueue();
  }

  resumeQueue() {
    if (this.queue.length === 0) {
      return;
    }

    const data = this.queue.shift();
    const blob = data.blob;

    createImageBitmap(blob)
      .then(imageBitmap => {
        this.workerContext.postMessage({
          imageBitmap: imageBitmap,
          url: data.url,
          instanceIndex: data.instanceIndex
        }, [imageBitmap]);
      }, error => {
        this.workerContext.postMessage({
          error: error.toString(),
          url: data.url,
          instanceIndex: data.instanceIndex
        });
      })
      .then(_ => this.resumeQueue())
      .catch(_ => this.resumeQueue());
  }

}

const handler = new ImageHandler(self);

self.onmessage = (e) => {
  return handler.enqueue(e.data);
};
