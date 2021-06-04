import { HtmlEditor, Toolbar, Editor } from '@aeaton/react-prosemirror';
import { plugins, schema, toolbar } from '@aeaton/react-prosemirror-config-default';

const WysiwygEditor = ({
  value = '',
  onChange,
  disabled = false
}) => {
  return (
    <div className="wysiwyg-editor">
      <HtmlEditor
        schema={schema}
        plugins={plugins}
        value={value || `<p>${value}</p>`}
        handleChange={onChange}
        debounce={250}
      >
        <Toolbar toolbar={toolbar} />
        <Editor autoFocus />
      </HtmlEditor>
    </div>
  );
};

export default WysiwygEditor;
