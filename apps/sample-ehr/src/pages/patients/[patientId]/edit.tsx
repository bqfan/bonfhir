import { MainPage } from "@/components";
import { codeableConcept } from "@bonfhir/core/r4b";
import { useFhirResourceForm } from "@bonfhir/ui-mantine/r4b";
import { FhirInput, FhirInputArray } from "@bonfhir/ui/r4b";
import {
  Box,
  Button,
  Group,
  LoadingOverlay,
  Paper,
  SimpleGrid,
  Stack,
} from "@mantine/core";
import { useRouter } from "next/router";

export default function EditPatient() {
  const router = useRouter();
  const { patientId } = router.query as { patientId: "new" | string };
  const newPatient = patientId === "new";

  const form = useFhirResourceForm({
    type: "Patient",
    id: patientId,
    mutationOptions: {
      onSuccess(data) {
        router.push(`/patients/${data.id}`);
      },
    },
  });

  return (
    <MainPage title={newPatient ? `New Patient` : `Edit Patient`}>
      <Paper>
        <form onSubmit={form.onSubmit}>
          <LoadingOverlay visible={form.query.isInitialLoading} />
          <Box maw={800}>
            <Stack>
              <FhirInputArray
                label="Name"
                min={1}
                {...form.getArrayInputProps("name", { newValue: {} })}
              >
                {({ index }) => {
                  return (
                    <FhirInput
                      type="HumanName"
                      mode="simple"
                      {...form.getInputProps(`name.${index}`)}
                    />
                  );
                }}
              </FhirInputArray>
              <FhirInputArray
                label="Identifiers"
                min={1}
                {...form.getArrayInputProps("identifier", { newValue: {} })}
              >
                {({ index }) => {
                  return (
                    <FhirInput
                      type="Identifier"
                      identifiers={[
                        {
                          system: "http://hl7.org/fhir/sid/us-ssn",
                          label: "SSN",
                          type: codeableConcept({
                            code: "SS",
                            display: "Social Security number",
                            system:
                              "http://terminology.hl7.org/CodeSystem/v2-0203",
                          }),
                          processValue: (value) => value.replace(/\W/g, ""),
                        },
                        {
                          system: "http://hl7.org/fhir/sid/us-mbi",
                          label: "MBI",
                          processValue: (value) => value.replace(/\W/g, ""),
                        },
                      ]}
                      {...form.getInputProps(`identifier.${index}`)}
                    />
                  );
                }}
              </FhirInputArray>
              <SimpleGrid cols={2} spacing="md" w="100%">
                <FhirInput
                  type="date"
                  label="Date of Birth"
                  {...form.getInputProps("birthDate")}
                />
                <FhirInput
                  type="dateTime"
                  label="Deceased"
                  {...form.getInputProps("deceasedDateTime")}
                />
                {/* <FhirInput
                  type="boolean"
                  label="Deceased"
                  mode="checkbox"
                  {...resourceForm.getInputProps("deceasedBoolean")}
                /> */}
                <FhirInput
                  type="code"
                  label="Gender"
                  mode="select"
                  source="http://hl7.org/fhir/ValueSet/administrative-gender"
                  {...form.getInputProps("gender")}
                />
                <FhirInput
                  type="CodeableConcept"
                  label="Marital Status"
                  mode="select"
                  source="http://hl7.org/fhir/ValueSet/marital-status"
                  {...form.getInputProps("maritalStatus")}
                />
              </SimpleGrid>
              <FhirInputArray
                label="Contact"
                {...form.getArrayInputProps("telecom", { newValue: {} })}
              >
                {({ index }) => {
                  return (
                    <FhirInput
                      type="ContactPoint"
                      {...form.getInputProps(`telecom.${index}`)}
                    />
                  );
                }}
              </FhirInputArray>
              <FhirInput
                type="Reference"
                resourceType="Organization"
                label="Managing Organization"
                // search={(query) => (search) =>
                //   search.name(query).type("Organization")}
                {...form.getInputProps("managingOrganization")}
              />
              <Group mt="md">
                <Button type="submit" loading={form.mutation.isLoading}>
                  Save
                </Button>
                <Button variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
              </Group>
            </Stack>
          </Box>
        </form>
      </Paper>
    </MainPage>
  );
}
