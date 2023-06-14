/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  AnyResourceType,
  DomainResource,
  ExtractResource,
  Retrieved,
  build,
} from "@bonfhir/core/r5";
import {
  UseFhirSaveMutationArgs,
  UseFhirSaveMutationOptions,
  useFhirRead,
  useFhirSaveMutation,
} from "@bonfhir/query/r5";
import { UseFormReturnType } from "@mantine/form";
import { UseMutationResult, UseQueryResult } from "@tanstack/react-query";
import { useEffect } from "react";
import { UseFhirFormReturnType, useFhirForm } from "./use-fhir-form.js";

export interface UseFhirResourceFormArgs<
  TResourceType extends AnyResourceType
> {
  type: TResourceType;
  id: string | "new" | undefined;
  defaultValues?: Partial<ExtractResource<TResourceType>>;
  mutationOptions?:
    | UseFhirSaveMutationOptions<TResourceType>["mutation"]
    | null
    | undefined;
  formOptions?: Parameters<
    typeof useFhirForm<ExtractResource<TResourceType>>
  >[0];
}

export interface UseFhirResourceFormResult<
  TResourceType extends AnyResourceType
> {
  query: UseQueryResult<Retrieved<ExtractResource<TResourceType>>>;
  mutation: UseMutationResult<
    Retrieved<ExtractResource<TResourceType>>,
    unknown,
    UseFhirSaveMutationArgs<TResourceType>,
    unknown
  >;
  form: UseFormReturnType<
    ExtractResource<TResourceType>,
    (values: { resourceType: TResourceType }) => ExtractResource<TResourceType>
  >;
  onSubmit: () => void;
  getInputProps: UseFhirFormReturnType<
    ExtractResource<TResourceType>,
    (values: { resourceType: TResourceType }) => ExtractResource<TResourceType>
  >["getInputProps"];
  getArrayInputProps: UseFhirFormReturnType<
    ExtractResource<TResourceType>,
    (values: { resourceType: TResourceType }) => ExtractResource<TResourceType>
  >["getArrayInputProps"];
}

/**
 * Encapsulate the whole logic to save a single FHIR resource using a controlled form.
 */
export function useFhirResourceForm<TResourceType extends AnyResourceType>(
  args: UseFhirResourceFormArgs<TResourceType>
): UseFhirResourceFormResult<TResourceType> {
  const isNew = args.id == null || args.id === "new";
  const query = useFhirRead(args.type, args.id || "new", {
    query: { enabled: !isNew },
  });

  const mutation = useFhirSaveMutation(args.type, {
    mutation: args.mutationOptions,
  });

  const form = useFhirForm({
    initialValues: {
      ...args.defaultValues,
      resourceType: args.type,
    },
    transformValues: (values) => build(args.type as any, values as any),
    ...(args.formOptions as any),
  });

  useEffect(() => {
    if (query.data) {
      let clonedResource = structuredClone(query.data) as any;
      if ((clonedResource as DomainResource).text) {
        delete (clonedResource as DomainResource).text;
      }
      clonedResource = {
        ...args.defaultValues,
        ...clonedResource,
      };
      form.setValues(clonedResource);
      form.resetDirty(clonedResource);
    }
  }, [query.isSuccess]);

  return {
    query,
    mutation,
    form: form as any,
    onSubmit: form.onSubmit((resource) => mutation.mutate(resource as any)),
    getInputProps: form.getInputProps,
    getArrayInputProps: form.getArrayInputProps,
  };
}
