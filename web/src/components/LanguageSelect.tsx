import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function LanguageSelect() {
  return (
    <Select>
      <SelectTrigger className="w-[150px]">
        <SelectValue placeholder="Language" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="Sql">Sql</SelectItem>
        <SelectItem value="Postgres">Postgres</SelectItem>
        <SelectItem value="Sqllite">Sqllite</SelectItem>
      </SelectContent>
    </Select>
  );
}
