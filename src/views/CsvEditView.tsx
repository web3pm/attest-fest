import { useEffect, useState } from "react";

import { AttestDialog } from "../components/AttestDialog";
import { Button } from "../components/ui/Button";
import CsvEditor from "../components/CsvEditor";
import { SchemaField } from "../eas/types/schema-field.type";
import { SchemaPills } from "../components/SchemaPills";
import { isSchemaFieldTypeName } from "../eas/utils/isSchemaFieldTypeName";
import { useEas } from "../eas/hooks/useEas";
import { useStateStore } from "../zustand/hooks/useStateStore";
import { useAccount } from "wagmi";
import { AttestDialogEoa } from "../components/AttestDialogEoa";

export function CsvEditView() {
  const { schemaRecord, schemaRecordError, schemaError } = useEas();
  const { address } = useAccount();

  // Local state
  const [attestDialogOpen, setAttestDialogOpen] = useState(false);
  const [editorTouched, setEditorTouched] = useState(false);
  const [submitDisabled, setSubmitDisabled] = useState(false);

  // Global state
  const csv = useStateStore((state) => state.csv);
  const csvError = useStateStore((state) => state.csvError);
  const selectedWalletAddress = useStateStore(
    (state) => state.selectedWalletAddress
  );

  function addRecipientToSchema() {
    if (!schemaRecord) return;
    const schema: SchemaField[] = [];
    schemaRecord.schema.split(",").forEach((field) => {
      const [type, name] = field.split(" ");
      if (isSchemaFieldTypeName(type)) {
        schema.push({ name, type });
      }
    });
    schema.push({ name: "recipient", type: "address" });
    useStateStore.setState({ schema });
  }

  useEffect(addRecipientToSchema, [schemaRecord]);

  function handleEditorChange(csv: string) {
    useStateStore.setState({ csv });
    setEditorTouched(true);
    setSubmitDisabled(true);
    setTimeout(() => setSubmitDisabled(false), 1500);
  }

  if (!schemaRecord || schemaError || schemaRecordError) return null;

  const buttonDisabled =
    submitDisabled ||
    !editorTouched ||
    !csv ||
    csv.length < 10 ||
    typeof csvError !== "undefined" ||
    attestDialogOpen;

  const isSafeAddress = selectedWalletAddress !== address;

  return (
    <>
      <p className="leading-loose text-center">
        Paste data or drop a csv file in the form below. In addition to the
        schema fields, you also need to include the recipient field for every
        row.
      </p>

      <SchemaPills />

      <CsvEditor
        onChange={handleEditorChange}
        onCsvError={(csvError) => useStateStore.setState({ csvError })}
      />

      {csvError && <div className="text-red-500">{csvError.message}</div>}

      <Button
        onClick={() => setAttestDialogOpen(true)}
        disabled={buttonDisabled}
        className="mb-10"
      >
        Submit
      </Button>
      {attestDialogOpen &&
        (isSafeAddress ? (
          <AttestDialog
            open={attestDialogOpen}
            close={() => setAttestDialogOpen(false)}
          />
        ) : (
          <AttestDialogEoa
            open={attestDialogOpen}
            close={() => setAttestDialogOpen(false)}
          />
        ))}
    </>
  );
}
