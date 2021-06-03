import { HtmlEditor, Toolbar, Editor } from '@aeaton/react-prosemirror';
import { plugins, schema, toolbar } from '@aeaton/react-prosemirror-config-default';

const WysiwygEditor = ({
  value = '',
  onSave,
  disabled
}) => {
  return (
    <div className="wysiwyg-editor">
      {value && (
        <HtmlEditor
          schema={schema}
          plugins={plugins}
          value={value}
          handleChange={onSave}
          debounce={250}
        >
          <Toolbar toolbar={toolbar} />
          <Editor autoFocus />
        </HtmlEditor>
      )}
    </div>
  );
};

export default WysiwygEditor;
