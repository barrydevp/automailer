import { format } from 'date-fns';

export function toDateDay(date: Date) {
  return format(date, 'MM-dd-yyyy');
}

const nonEnumerablePropsToCopy = ['code', 'errno', 'syscall'];

export function errToJSON(
  err: Error & { toJSON: () => Record<string, any> },
): Record<string, any> {
  let json: Record<string, any>;

  if (typeof err.toJSON === 'function') {
    json = err.toJSON();
  } else {
    // stub error tojson
    const toJSON = function (_this: Error) {
      const json = {
        // Add all enumerable properties
        ..._this,
        // normal props
        name: _this.name,
        message: _this.message,
        stack: _this.stack,
      };

      nonEnumerablePropsToCopy.forEach((key) => {
        if (key in _this) json[key] = _this[key];
      });

      return JSON.parse(JSON.stringify(json));
    };

    // get error json
    json = toJSON(err);
  }

  // return error json
  return json;
}
