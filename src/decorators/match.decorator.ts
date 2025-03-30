import { ClassConstructor } from 'class-transformer'
import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator'

export const Match = <T>(
  type: ClassConstructor<T>,
  property: (o: T) => unknown,
  validationOptions?: ValidationOptions,
) => {
  return (object: object, propertyName: string) => {
    // Replace `any` with `object`
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [property],
      validator: MatchConstraint,
    })
  }
}

@ValidatorConstraint({ name: 'Match' })
export class MatchConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    const [fn] = args.constraints as [(o: object) => unknown]
    return fn(args.object as object) === value
  }

  defaultMessage(args: ValidationArguments): string {
    const [constraintProperty] = args.constraints as [(o: object) => unknown]
    return `${constraintProperty} and ${args.property} do not match`
  }
}
