# @adapttable/angular-unstyled

The Angular AdaptTable drawn with native HTML and no styles of its own, over
[`@adapttable/angular`](../angular/README.md). Every element carries the
`data-adapttable-part` names every kit shares, so you style it with your own
CSS or Tailwind.

**Private while it reaches parity with the React kits.** It is not published
yet. Today it covers search, sorting, paging, the phone card layout, row
selection and keyboard cell navigation, and it passes the table conformance
suite every kit is held to.

## Usage

```ts
import { Component } from "@angular/core";
import { AdaptDataTable } from "@adapttable/angular-unstyled";
import type { ColumnDef } from "@adapttable/angular";

interface Person {
  id: string;
  name: string;
  age: number;
}

@Component({
  selector: "people-table",
  imports: [AdaptDataTable],
  template: `
    <adapt-data-table
      [data]="people"
      [columns]="columns"
      [rowKey]="rowKey"
      tableLabel="People"
      [selectable]="true"
      [cellNavigation]="true"
    />
  `,
})
export class PeopleTable {
  readonly people: Person[] = [];
  readonly columns: ColumnDef<Person>[] = [
    { key: "name", sortable: true },
    { key: "age", sortable: true },
  ];
  readonly rowKey = (row: Person) => row.id;
}
```

A column's cell can be an `ng-template` declared inside the table:

```html
<adapt-data-table [data]="people" [columns]="columns" [rowKey]="rowKey">
  <ng-template adaptCellTemplate="name" let-value="value">
    <strong>{{ value }}</strong>
  </ng-template>
</adapt-data-table>
```
