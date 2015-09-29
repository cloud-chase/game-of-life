define(['jquery'], function($) {
  return {
    new: function() {
      var that = {},
          props = [],
          nodes = [],

          addDropdownUI = function($host, prop) {
            var displayName, value, 
                index = 0,
                $select = $host.append($('<select id="' + prop.id + '"></select>')).find('select').last();

            prop.options.forEach(function(option) {
              var selected = '';
              if (option.default) {
                selected = 'selected="true"';
                prop.callback(option.default);
              }

              $select.append($('<option ' + selected + '></option>').val(index).html(option.caption));
              index += 1;
            });
            
            return $select;
          },

          addTextUI = function($host, prop) {
            var $input = $host.append($('<input type="text" id="' + prop.id + '" value="' + prop.initialValue + '" />')).find('input');
            prop.callback(prop.initialValue);
            return $input;
          },

          addTextareaUI = function($host, prop) {
            var $input = $host.append($('<textarea id="' + prop.id + '" cols="40" rows="5">' + prop.initialValue + '</textarea>')).find('textarea');
            prop.callback(prop.initialValue);
            return $input;
          };

      that.addTextProperty = function(id, caption, initialValue, callback) {
        props.push({id: id, type: 'text', caption: caption, initialValue: initialValue, callback: callback});
      };

      that.addTextareaProperty = function(id, caption, initialValue, callback) {
        props.push({id: id, type: 'textarea', caption: caption, initialValue: initialValue, callback: callback});
      };

      that.addDropdownProperty = function(id, caption, options, callback) {
        props.push({id: id, type: 'dropdown', caption: caption, options: options, callback: callback});
      };

      that.createUI = function($host) {
        var $propEl, $propVal, $elem;
        
        for (var prop of props) {
          $propEl = $host.append($('<div class="model-property"><span class="model-property-caption">' + prop.caption + ':</span>')).find('.model-property').last();
          $propVal = $propEl.append($('<span class="model-property-value"></span>')).find('.model-property-value').last();
          
          switch (prop.type) {
            case 'dropdown':
              $elem = addDropdownUI($propVal, prop);
              break;
            case 'textarea':
              $elem = addTextareaUI($propVal, prop);
              break;
            default:
              $elem = addTextUI($propVal, prop);
              break;
          }
          
          $elem.on('change', function(e) {
            prop.callback(this.value);
          });

          nodes = nodes.concat($propEl.get());
        }
      };

      /**
        Reset the property bag, removing any DOM constructs that were created.
      */
      that.clear = function() {
        for (var node of nodes) {
          node.parentNode.removeChild(node);
        }
        nodes.length = props.length = 0;
      };
      
      return that;
    }
  };
});
